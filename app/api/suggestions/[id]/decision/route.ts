// API Route: Approve/Reject Hangout Suggestion
// POST /api/suggestions/:id/decision
// Body: { decision: 'APPROVE' | 'REJECT', ownerComment? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  ownerComment: z.string().optional(),
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

    // Get acting user
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      include: {
        ownedPups: true,
      },
    });

    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can approve/reject suggestions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { decision, ownerComment } = decisionSchema.parse(body);

    // Get suggestion
    const suggestion = await prisma.hangoutSuggestion.findUnique({
      where: { id },
      include: {
        pup: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Verify that acting user owns the pup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownsPup = actingUser.ownedPups.some((p: any) => p.id === suggestion.pupId);
    if (!ownsPup) {
      return NextResponse.json(
        { error: 'You do not own this pup' },
        { status: 403 }
      );
    }

    if (suggestion.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This suggestion has already been processed' },
        { status: 400 }
      );
    }

    if (decision === 'APPROVE') {
      // Create hangout and update suggestion
      const [hangout, updatedSuggestion] = await prisma.$transaction([
        prisma.hangout.create({
          data: {
            pupId: suggestion.pupId,
            startAt: suggestion.startAt,
            endAt: suggestion.endAt,
            eventName: suggestion.eventName,
            status: 'ASSIGNED',
            assignedFriendUserId: suggestion.suggestedByFriendUserId,
            createdByOwnerUserId: actingUserId,
            ownerNotes: ownerComment,
          },
        }),
        prisma.hangoutSuggestion.update({
          where: { id },
          data: {
            status: 'APPROVED',
            ownerDecisionByUserId: actingUserId,
            ownerDecisionAt: new Date(),
            ownerComment,
          },
        }),
      ]);

      return NextResponse.json({
        suggestion: updatedSuggestion,
        hangout,
      });
    } else {
      // REJECT
      const updatedSuggestion = await prisma.hangoutSuggestion.update({
        where: { id },
        data: {
          status: 'REJECTED',
          ownerDecisionByUserId: actingUserId,
          ownerDecisionAt: new Date(),
          ownerComment,
        },
        include: {
          pup: true,
          suggestedByFriend: true,
          ownerDecisionBy: true,
        },
      });

      return NextResponse.json({ suggestion: updatedSuggestion });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error processing suggestion decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
