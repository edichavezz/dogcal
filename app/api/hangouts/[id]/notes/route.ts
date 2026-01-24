// API Route: Add Note to Hangout
// POST /api/hangouts/:id/notes
// Body: { noteText: string }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const addNoteSchema = z.object({
  noteText: z.string().min(1, 'Note cannot be empty'),
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

    // Parse and validate request body
    const body = await request.json();
    const { noteText } = addNoteSchema.parse(body);

    // Get hangout with pup owner info
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: {
          include: {
            owner: true,
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

    // Check if acting user has permission to add notes
    // Can add notes if: owner of the pup OR assigned friend
    const isOwner = hangout.pup.owner.id === actingUserId;
    const isAssignedFriend = hangout.assignedFriendUserId === actingUserId;

    if (!isOwner && !isAssignedFriend) {
      return NextResponse.json(
        { error: 'You do not have permission to add notes to this hangout' },
        { status: 403 }
      );
    }

    // Create note
    const note = await prisma.hangoutNote.create({
      data: {
        hangoutId: id,
        authorUserId: actingUserId,
        noteText,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
