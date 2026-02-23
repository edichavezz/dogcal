import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

// GET /api/meetups - returns upcoming meetups with RSVP info
export async function GET() {
  try {
    const now = new Date();
    const actingUserId = await getActingUserId(); // optional — used to mark current user's RSVPs

    const meetups = await prisma.communityMeetup.findMany({
      where: { startAt: { gte: now } },
      orderBy: { startAt: 'asc' },
      take: 12,
      include: {
        rsvps: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    const result = meetups.map((m) => ({
      id: m.id,
      startAt: m.startAt,
      endAt: m.endAt,
      location: m.location,
      notes: m.notes,
      rsvpCount: m.rsvps.length,
      rsvpNames: m.rsvps.map((r) => r.user.name),
      currentUserRsvpd: actingUserId ? m.rsvps.some((r) => r.userId === actingUserId) : false,
    }));

    return NextResponse.json({ meetups: result });
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meetups - generate next 8 Sunday instances (admin only)
export async function POST() {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build next 8 Sundays starting from the nearest upcoming Sunday at 10am
    const now = new Date();
    const date = new Date(now);
    date.setHours(10, 0, 0, 0);

    const dayOfWeek = date.getDay(); // 0 = Sunday
    let daysUntilSunday: number;
    if (dayOfWeek === 0) {
      daysUntilSunday = now.getHours() >= 10 ? 7 : 0;
    } else {
      daysUntilSunday = 7 - dayOfWeek;
    }
    date.setDate(date.getDate() + daysUntilSunday);

    const meetupsToCreate: Array<{ startAt: Date; endAt: Date; location: string }> = [];
    for (let i = 0; i < 8; i++) {
      const startAt = new Date(date);
      const endAt = new Date(date);
      endAt.setHours(11, 0, 0, 0);
      meetupsToCreate.push({
        startAt,
        endAt,
        location: 'Clissold Park, Stoke Newington, London N16 9HJ',
      });
      date.setDate(date.getDate() + 7);
    }

    // Only create meetups that don't already exist (deduplicate by startAt)
    const existing = await prisma.communityMeetup.findMany({
      where: { startAt: { in: meetupsToCreate.map((m) => m.startAt) } },
      select: { startAt: true },
    });
    const existingDates = new Set(existing.map((m) => m.startAt.toISOString()));
    const newMeetups = meetupsToCreate.filter(
      (m) => !existingDates.has(m.startAt.toISOString())
    );

    const created = await prisma.communityMeetup.createMany({ data: newMeetups });
    return NextResponse.json({ created: created.count });
  } catch (error) {
    console.error('Error generating meetups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
