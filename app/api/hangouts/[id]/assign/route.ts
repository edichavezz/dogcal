// API Route: Assign Friend to Hangout
// POST /api/hangouts/:id/assign

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

    // Get acting user
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
    });

    if (!actingUser || actingUser.role !== 'FRIEND') {
      return NextResponse.json(
        { error: 'Only friends can assign themselves to hangouts' },
        { status: 403 }
      );
    }

    // Get hangout
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: true,
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    if (hangout.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Hangout is not available (already assigned or completed)' },
        { status: 400 }
      );
    }

    // Verify friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId: hangout.pupId,
        friendUserId: actingUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'You do not have permission to care for this pup' },
        { status: 403 }
      );
    }

    // Assign hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: actingUserId,
        status: 'ASSIGNED',
      },
      include: {
        pup: true,
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    return NextResponse.json({ hangout: updatedHangout });
  } catch (error) {
    console.error('Error assigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
