// API Route: Add Friend to Pup
// POST /api/pups/[id]/friends
// Body: { friendUserId: string }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const addFriendSchema = z.object({
  friendUserId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pupId } = await params;
    const body = await request.json();
    const data = addFriendSchema.parse(body);

    // Verify pup exists
    const pup = await prisma.pup.findUnique({
      where: { id: pupId },
    });

    if (!pup) {
      return NextResponse.json(
        { error: 'Pup not found' },
        { status: 404 }
      );
    }

    // Verify friend exists and has FRIEND role
    const friend = await prisma.user.findUnique({
      where: { id: data.friendUserId },
    });

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend user not found' },
        { status: 404 }
      );
    }

    if (friend.role !== 'FRIEND') {
      return NextResponse.json(
        { error: 'User must have FRIEND role' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.pupFriendship.findUnique({
      where: {
        pupId_friendUserId: {
          pupId,
          friendUserId: data.friendUserId,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friendship already exists' },
        { status: 400 }
      );
    }

    // Create friendship
    const friendship = await prisma.pupFriendship.create({
      data: {
        pupId,
        friendUserId: data.friendUserId,
      },
      include: {
        pup: true,
        friend: true,
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
    console.error('Add friend error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
