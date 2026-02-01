// API Route: Single Gallery Photo Operations
// DELETE /api/pups/:id/photos/:photoId - Remove gallery photo (owner only)

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { deletePhoto, getPathFromUrl } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: pupId, photoId } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get photo with pup info to verify ownership
    const photo = await prisma.pupPhoto.findUnique({
      where: { id: photoId },
      include: {
        pup: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    if (photo.pupId !== pupId) {
      return NextResponse.json(
        { error: 'Photo does not belong to this pup' },
        { status: 400 }
      );
    }

    if (photo.pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Only the owner can delete gallery photos' },
        { status: 403 }
      );
    }

    // Delete from storage
    const path = getPathFromUrl(photo.photoUrl);
    if (path) {
      try {
        await deletePhoto(path);
      } catch (error) {
        console.error('Failed to delete photo from storage:', error);
        // Continue with database deletion anyway
      }
    }

    // Delete from database
    await prisma.pupPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete gallery photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
