// API Route: Gallery Photos for Pup
// GET /api/pups/:id/photos - List all photos for a pup
// POST /api/pups/:id/photos - Upload new gallery photo (owner only)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { uploadPhoto } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pupId } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access (owner or friend with friendship)
    const pup = await prisma.pup.findUnique({
      where: { id: pupId },
      include: {
        friendships: {
          where: { friendUserId: actingUserId },
        },
      },
    });

    if (!pup) {
      return NextResponse.json({ error: 'Pup not found' }, { status: 404 });
    }

    const isOwner = pup.ownerUserId === actingUserId;
    const isFriend = pup.friendships.length > 0;

    if (!isOwner && !isFriend) {
      return NextResponse.json(
        { error: 'You do not have access to this pup' },
        { status: 403 }
      );
    }

    const photos = await prisma.pupPhoto.findMany({
      where: { pupId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Get pup photos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const uploadGallerySchema = z.object({
  caption: z.string().max(500).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pupId } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const pup = await prisma.pup.findUnique({
      where: { id: pupId },
    });

    if (!pup) {
      return NextResponse.json({ error: 'Pup not found' }, { status: 404 });
    }

    if (pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Only the owner can upload gallery photos' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate caption
    uploadGallerySchema.parse({ caption });

    // Get max sortOrder
    const maxSortOrder = await prisma.pupPhoto.aggregate({
      where: { pupId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const photoId = crypto.randomUUID();
    const path = `pups/${pupId}/gallery/${photoId}.${fileExt}`;

    // Upload to storage
    const publicUrl = await uploadPhoto(file, path);

    // Create database record
    const photo = await prisma.pupPhoto.create({
      data: {
        pupId,
        photoUrl: publicUrl,
        caption: caption || null,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Upload gallery photo error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
