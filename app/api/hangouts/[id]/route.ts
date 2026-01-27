// API Route: Get and Update Hangout Details
// GET /api/hangouts/:id
// PATCH /api/hangouts/:id

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const updateHangoutSchema = z.object({
  eventName: z.string().max(100).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  ownerNotes: z.string().optional().nullable(),
  assignedFriendUserId: z.string().uuid().optional().nullable(),
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

    // Get existing hangout
    const existingHangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: { include: { owner: true } },
        assignedFriend: true,
      },
    });

    if (!existingHangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const updates = updateHangoutSchema.parse(body);

    // Check permissions
    const isOwner = existingHangout.pup.ownerUserId === actingUserId;
    const isAssignedFriend = existingHangout.assignedFriendUserId === actingUserId;

    // Only owner can change eventName, ownerNotes, or assignedFriendUserId
    if ((updates.eventName !== undefined || updates.ownerNotes !== undefined || updates.assignedFriendUserId !== undefined) && !isOwner) {
      return NextResponse.json(
        { error: 'Only the pup owner can update event details and assignment' },
        { status: 403 }
      );
    }

    // Only owner or assigned friend can reschedule
    if ((updates.startAt || updates.endAt) && !isOwner && !isAssignedFriend) {
      return NextResponse.json(
        { error: 'Only the pup owner or assigned friend can reschedule' },
        { status: 403 }
      );
    }

    // Validate time range if updating times
    const newStartAt = updates.startAt ? new Date(updates.startAt) : existingHangout.startAt;
    const newEndAt = updates.endAt ? new Date(updates.endAt) : existingHangout.endAt;

    if (newStartAt >= newEndAt) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check for time conflicts with other hangouts (only if times are changing)
    if (updates.startAt || updates.endAt) {
      const conflictingHangout = await prisma.hangout.findFirst({
        where: {
          pupId: existingHangout.pupId,
          id: { not: id },
          status: { in: ['OPEN', 'ASSIGNED'] },
          OR: [
            // New hangout starts during existing hangout
            {
              AND: [
                { startAt: { lte: newStartAt } },
                { endAt: { gt: newStartAt } },
              ],
            },
            // New hangout ends during existing hangout
            {
              AND: [
                { startAt: { lt: newEndAt } },
                { endAt: { gte: newEndAt } },
              ],
            },
            // New hangout completely contains existing hangout
            {
              AND: [
                { startAt: { gte: newStartAt } },
                { endAt: { lte: newEndAt } },
              ],
            },
          ],
        },
      });

      if (conflictingHangout) {
        return NextResponse.json(
          { error: 'This time slot conflicts with another hangout for this pup' },
          { status: 400 }
        );
      }
    }

    // Validate new friendship if changing assignment
    if (updates.assignedFriendUserId !== undefined && updates.assignedFriendUserId) {
      const friendship = await prisma.pupFriendship.findFirst({
        where: {
          pupId: existingHangout.pupId,
          friendUserId: updates.assignedFriendUserId,
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: 'Cannot assign to this friend - no friendship exists' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (updates.eventName !== undefined) updateData.eventName = updates.eventName;
    if (updates.ownerNotes !== undefined) updateData.ownerNotes = updates.ownerNotes;
    if (updates.startAt) updateData.startAt = newStartAt;
    if (updates.endAt) updateData.endAt = newEndAt;
    if (updates.assignedFriendUserId !== undefined) {
      updateData.assignedFriendUserId = updates.assignedFriendUserId;
      updateData.status = updates.assignedFriendUserId ? 'ASSIGNED' : 'OPEN';
    }

    // Update hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: updateData,
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

    console.error('Error updating hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
