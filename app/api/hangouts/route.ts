// API Route: Create Hangout
// POST /api/hangouts
// Body: { pupId, startAt, endAt, ownerNotes?, assignedFriendUserId? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createHangoutSchema = z.object({
  pupId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  ownerNotes: z.string().optional(),
  assignedFriendUserId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json(
        { error: 'No acting user set' },
        { status: 401 }
      );
    }

    // Get acting user
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
    });

    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can create hangouts' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { pupId, startAt, endAt, ownerNotes, assignedFriendUserId } = createHangoutSchema.parse(body);

    // Validate that pup belongs to acting user
    const pup = await prisma.pup.findUnique({
      where: { id: pupId },
    });

    if (!pup || pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Pup not found or you do not own this pup' },
        { status: 403 }
      );
    }

    // If assigning to a friend, validate friendship exists
    if (assignedFriendUserId) {
      const friendship = await prisma.pupFriendship.findFirst({
        where: {
          pupId,
          friendUserId: assignedFriendUserId,
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: 'Cannot assign hangout to this friend - no friendship exists' },
          { status: 400 }
        );
      }
    }

    // Create hangout
    const hangout = await prisma.hangout.create({
      data: {
        pupId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: assignedFriendUserId ? 'ASSIGNED' : 'OPEN',
        assignedFriendUserId,
        createdByOwnerUserId: actingUserId,
        ownerNotes,
      },
      include: {
        pup: true,
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    return NextResponse.json({ hangout }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
