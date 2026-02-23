import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

// POST /api/meetups/:id/rsvp - add RSVP for current user
export async function POST(
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

    await prisma.meetupRSVP.upsert({
      where: { meetupId_userId: { meetupId: id, userId: actingUserId } },
      create: { meetupId: id, userId: actingUserId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding RSVP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meetups/:id/rsvp - cancel RSVP for current user
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

    await prisma.meetupRSVP.deleteMany({
      where: { meetupId: id, userId: actingUserId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
