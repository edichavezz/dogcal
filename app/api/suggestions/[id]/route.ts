// API Route: Get and Update Hangout Suggestion Details
// GET /api/suggestions/:id
// PATCH /api/suggestions/:id

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const updateSuggestionSchema = z.object({
  eventName: z.string().max(100).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  friendComment: z.string().optional().nullable(),
});

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

    // Get suggestion with all related data
    const suggestion = await prisma.hangoutSuggestion.findUnique({
      where: { id },
      include: {
        pup: {
          include: {
            owner: true,
          },
        },
        suggestedByFriend: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Get existing suggestion
    const existingSuggestion = await prisma.hangoutSuggestion.findUnique({
      where: { id },
      include: {
        pup: { include: { owner: true } },
        suggestedByFriend: true,
      },
    });

    if (!existingSuggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Only the friend who created the suggestion can edit it
    if (existingSuggestion.suggestedByFriendUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Only the friend who created this suggestion can edit it' },
        { status: 403 }
      );
    }

    // Only allow editing PENDING suggestions
    if (existingSuggestion.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot edit a suggestion that has been approved or rejected' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const updates = updateSuggestionSchema.parse(body);

    // Validate time range if updating times
    const newStartAt = updates.startAt ? new Date(updates.startAt) : existingSuggestion.startAt;
    const newEndAt = updates.endAt ? new Date(updates.endAt) : existingSuggestion.endAt;

    if (newStartAt >= newEndAt) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (updates.eventName !== undefined) updateData.eventName = updates.eventName;
    if (updates.friendComment !== undefined) updateData.friendComment = updates.friendComment;
    if (updates.startAt) updateData.startAt = newStartAt;
    if (updates.endAt) updateData.endAt = newEndAt;

    // Update suggestion
    const updatedSuggestion = await prisma.hangoutSuggestion.update({
      where: { id },
      data: updateData,
      include: {
        pup: { include: { owner: true } },
        suggestedByFriend: true,
      },
    });

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
