// API Route: Export confirmed hangout as .ics file
// GET /api/hangouts/:id/calendar

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actingUserId = await getActingUserId();

  if (!actingUserId) {
    return NextResponse.json(
      { error: 'No acting user set' },
      { status: 401 }
    );
  }

  const hangout = await prisma.hangout.findUnique({
    where: { id },
    include: {
      pup: { include: { owner: true } },
      assignedFriend: true,
    },
  });

  if (!hangout) {
    return NextResponse.json(
      { error: 'Hangout not found' },
      { status: 404 }
    );
  }

  const isOwner = hangout.pup.ownerUserId === actingUserId;
  const isAssignedFriend = hangout.assignedFriendUserId === actingUserId;

  if (!isOwner && !isAssignedFriend) {
    return NextResponse.json(
      { error: 'Not authorized to export this hangout' },
      { status: 403 }
    );
  }

  if (hangout.status !== 'ASSIGNED') {
    return NextResponse.json(
      { error: 'Only confirmed hangouts can be exported' },
      { status: 400 }
    );
  }

  const summary = hangout.eventName
    ? hangout.eventName
    : `${hangout.pup.name} hangout`;

  const descriptionParts = [
    `Dogcal hangout for ${hangout.pup.name}.`,
    `Owner: ${hangout.pup.owner.name}.`,
  ];

  if (hangout.assignedFriend) {
    descriptionParts.push(`Helper: ${hangout.assignedFriend.name}.`);
  }

  if (hangout.ownerNotes) {
    descriptionParts.push(`Notes: ${hangout.ownerNotes}`);
  }

  const description = descriptionParts.join(' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dogcal//Hangout Calendar//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:dogcal-${hangout.id}@dogcal`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(hangout.startAt)}`,
    `DTEND:${formatIcsDate(hangout.endAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const filename = `dogcal-hangout-${hangout.pup.name.toLowerCase().replace(/\s+/g, '-')}.ics`;

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
