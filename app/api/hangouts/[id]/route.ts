// API Route: Get Hangout Details
// GET /api/hangouts/:id

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Get hangout with all related data
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: {
          include: {
            owner: true,
          },
        },
        assignedFriend: true,
        createdByOwner: true,
        notes: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hangout });
  } catch (error) {
    console.error('Error fetching hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
