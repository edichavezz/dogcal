// API Route: Create Friendship
// POST /api/friendships
// Body: { pupId, friendUserId, historyWithPup? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createFriendshipSchema = z.object({
  pupId: z.string().uuid(),
  friendUserId: z.string().uuid(),
  historyWithPup: z.string().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createFriendshipSchema.parse(body);

    // Verify pup ownership
    const pup = await prisma.pup.findUnique({ where: { id: data.pupId } });
    if (!pup || pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only add friends to your own pups' },
        { status: 403 }
      );
    }

    // Verify friend user exists
    const friend = await prisma.user.findUnique({
      where: { id: data.friendUserId },
    });
    if (!friend) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existing = await prisma.pupFriendship.findFirst({
      where: {
        pupId: data.pupId,
        friendUserId: data.friendUserId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Friendship already exists' },
        { status: 400 }
      );
    }

    const friendship = await prisma.pupFriendship.create({
      data,
      include: {
        friend: true,
        pup: true,
      },
    });

    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create friendship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
