// API Route: Get/Update/Delete Pup
// GET /api/pups/:id - Get pup with friendships
// PATCH /api/pups/:id - Update pup
// DELETE /api/pups/:id - Delete pup

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const updatePupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(100).optional().nullable(),
  careInstructions: z.string().max(2000).optional().nullable(),
  profilePhotoUrl: z.string().url().optional().nullable(),
  // FAQ fields
  about: z.string().max(2000).optional().nullable(),
  food: z.string().max(2000).optional().nullable(),
  treats: z.string().max(2000).optional().nullable(),
  walks: z.string().max(2000).optional().nullable(),
  leash: z.string().max(2000).optional().nullable(),
  socialising: z.string().max(2000).optional().nullable(),
  tricks: z.string().max(2000).optional().nullable(),
  play: z.string().max(2000).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pup = await prisma.pup.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        friendships: {
          include: {
            friend: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!pup) {
      return NextResponse.json({ error: 'Pup not found' }, { status: 404 });
    }

    return NextResponse.json({ pup });
  } catch (error) {
    console.error('Get pup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const pup = await prisma.pup.findUnique({ where: { id } });
    if (!pup || pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own pups' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = updatePupSchema.parse(body);

    const updatedPup = await prisma.pup.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ pup: updatedPup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update pup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const pup = await prisma.pup.findUnique({ where: { id } });
    if (!pup || pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own pups' },
        { status: 403 }
      );
    }

    await prisma.pup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete pup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
