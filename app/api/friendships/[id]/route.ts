// API Route: Update/Delete Friendship
// PATCH /api/friendships/:id - Update friendship (history)
// DELETE /api/friendships/:id - Delete friendship

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const updateFriendshipSchema = z.object({
  historyWithPup: z.string().max(1000).optional().nullable(),
});

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

    // Verify ownership through pup (owners can update) OR friend user (friends can update their own history)
    const friendship = await prisma.pupFriendship.findUnique({
      where: { id },
      include: { pup: true },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Allow pup owner or the friend themselves to update
    if (friendship.pup.ownerUserId !== actingUserId && friendship.friendUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own friendships' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = updateFriendshipSchema.parse(body);

    const updatedFriendship = await prisma.pupFriendship.update({
      where: { id },
      data: updates,
      include: {
        friend: true,
        pup: true,
      },
    });

    return NextResponse.json({ friendship: updatedFriendship });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update friendship error:', error);
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

    // Verify ownership through pup
    const friendship = await prisma.pupFriendship.findUnique({
      where: { id },
      include: { pup: true },
    });

    if (!friendship || friendship.pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only remove friends from your own pups' },
        { status: 403 }
      );
    }

    await prisma.pupFriendship.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete friendship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
