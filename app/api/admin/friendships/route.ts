// Admin API: Manage All Friendships
// GET /api/admin/friendships - list all friendships
// POST /api/admin/friendships - create a friendship (no ownership check)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  pupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function GET() {
  try {
    const friendships = await prisma.pupFriendship.findMany({
      select: {
        id: true,
        pupId: true,
        friendUserId: true,
        pup: { select: { id: true, name: true } },
        friend: { select: { id: true, name: true } },
      },
      orderBy: [{ pup: { name: 'asc' } }, { friend: { name: 'asc' } }],
    });

    return NextResponse.json({
      friendships: friendships.map((f) => ({
        id: f.id,
        pupId: f.pup.id,
        pupName: f.pup.name,
        friendUserId: f.friend.id,
        friendName: f.friend.name,
      })),
    });
  } catch (error) {
    console.error('Admin get friendships error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pupId, userId } = createSchema.parse(body);

    const pup = await prisma.pup.findUnique({ where: { id: pupId } });
    if (!pup) {
      return NextResponse.json({ error: 'Pup not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (pup.ownerUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot add the pup\'s own owner as a friend' },
        { status: 400 }
      );
    }

    const friendship = await prisma.pupFriendship.create({
      data: { pupId, friendUserId: userId },
      select: {
        id: true,
        pup: { select: { id: true, name: true } },
        friend: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        friendship: {
          id: friendship.id,
          pupId: friendship.pup.id,
          pupName: friendship.pup.name,
          friendUserId: friendship.friend.id,
          friendName: friendship.friend.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 });
    }
    console.error('Admin create friendship error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
