// API Route: Add and Get Notes for Hangout
// GET /api/hangouts/:id/notes - Fetch notes on demand with pagination
// POST /api/hangouts/:id/notes - Add a note
// Body: { noteText: string }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const addNoteSchema = z.object({
  noteText: z.string().min(1, 'Note cannot be empty'),
});

// GET - Fetch notes for a hangout with pagination and caching
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

    // Parse pagination params from URL
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get('take') || '20'), 50);
    const skip = parseInt(searchParams.get('skip') || '0');

    // Verify hangout exists
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      select: {
        id: true,
        pup: {
          select: {
            ownerUserId: true,
          },
        },
        assignedFriendUserId: true,
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Fetch notes with pagination
    const [notes, totalCount] = await Promise.all([
      prisma.hangoutNote.findMany({
        where: { hangoutId: id },
        select: {
          id: true,
          noteText: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take,
        skip,
      }),
      prisma.hangoutNote.count({
        where: { hangoutId: id },
      }),
    ]);

    const response = NextResponse.json({
      notes,
      pagination: {
        total: totalCount,
        take,
        skip,
        hasMore: skip + notes.length < totalCount,
      },
    });

    // Add cache headers for browser caching
    response.headers.set(
      'Cache-Control',
      'private, max-age=60, stale-while-revalidate=120'
    );

    return response;
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a note to a hangout
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
