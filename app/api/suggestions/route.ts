// API Route: Create Hangout Suggestion
// POST /api/suggestions
// Body: { pupId, startAt, endAt, friendComment? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createSuggestionSchema = z.object({
  pupId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  friendComment: z.string().optional(),
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

    if (!actingUser || actingUser.role !== 'FRIEND') {
      return NextResponse.json(
        { error: 'Only friends can suggest hangout times' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { pupId, startAt, endAt, friendComment } = createSuggestionSchema.parse(body);

    // Verify friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId,
        friendUserId: actingUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'You do not have permission to suggest times for this pup' },
        { status: 403 }
      );
    }

    // Create suggestion
    const suggestion = await prisma.hangoutSuggestion.create({
      data: {
        pupId,
        suggestedByFriendUserId: actingUserId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: 'PENDING',
        friendComment,
      },
      include: {
        pup: {
          include: {
            owner: true,
          },
        },
        suggestedByFriend: true,
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
