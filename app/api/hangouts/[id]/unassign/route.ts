// API Route: Unassign Friend from Hangout
// POST /api/hangouts/:id/unassign

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

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

    // Get hangout
    const hangout = await prisma.hangout.findUnique({
      where: { id },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Verify that acting user is the assigned friend
    if (hangout.assignedFriendUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'You are not assigned to this hangout' },
        { status: 403 }
      );
    }

    // Unassign hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: null,
        status: 'OPEN',
      },
      include: {
        pup: true,
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    return NextResponse.json({ hangout: updatedHangout });
  } catch (error) {
    console.error('Error unassigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
