// API Route: Delete Friendship
// DELETE /api/friendships/:id

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

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
