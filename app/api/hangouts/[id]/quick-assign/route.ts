// API Route: Quick Assign Friend to Hangout
// POST /api/hangouts/:id/quick-assign
// Body: { friendUserId: string }
// Purpose: Owner assigns specific friend directly from calendar

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const quickAssignSchema = z.object({
  friendUserId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json(
        { error: 'No acting user set' },
        { status: 401 }
      );
    }

    // Get existing hangout
    const existingHangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: { include: { owner: true } },
      },
    });

    if (!existingHangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Only owner can quick-assign
    const isOwner = existingHangout.pup.ownerUserId === actingUserId;
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the pup owner can assign friends' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { friendUserId } = quickAssignSchema.parse(body);

    // Validate friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId: existingHangout.pupId,
        friendUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Cannot assign this friend - no friendship exists' },
        { status: 400 }
      );
    }

    // Update hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: friendUserId,
        status: 'ASSIGNED',
      },
      include: {
        pup: { include: { owner: true } },
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    return NextResponse.json({ hangout: updatedHangout });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error quick-assigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
