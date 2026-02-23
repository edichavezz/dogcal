import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

// PATCH /api/meetups/:id - update a meetup (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetup = await prisma.communityMeetup.findUnique({ where: { id } });
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    const body = await request.json();
    const { startAt, endAt, location, notes } = body as {
      startAt?: string;
      endAt?: string;
      location?: string;
      notes?: string;
    };

    const updateData: { startAt?: Date; endAt?: Date; location?: string; notes?: string | null } = {};
    if (startAt) updateData.startAt = new Date(startAt);
    if (endAt) updateData.endAt = new Date(endAt);
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await prisma.communityMeetup.update({
      where: { id },
      data: updateData,
      include: {
        rsvps: { select: { userId: true, user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ meetup: updated });
  } catch (error) {
    console.error('Error updating meetup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meetups/:id - delete a single meetup (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetup = await prisma.communityMeetup.findUnique({ where: { id } });
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    await prisma.communityMeetup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meetup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
