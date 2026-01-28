// API Route: Create Hangout
// POST /api/hangouts
// Body: { pupId, startAt, endAt, ownerNotes?, eventName?, assignedFriendUserId? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { sendWhatsAppMessage, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { generateHangoutCreatedMessage } from '@/lib/messageTemplates';

const createHangoutSchema = z.object({
  pupId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  ownerNotes: z.string().optional(),
  eventName: z.string().max(100).optional(),
  assignedFriendUserId: z.string().uuid().optional(),
  repeatEnabled: z.boolean().optional(),
  repeatFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  repeatCount: z.number().int().min(2).max(52).optional(),
});

// Helper function to generate repeated dates
function generateRepeatDates(
  startAt: Date,
  endAt: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  count: number
): Array<{ startAt: Date; endAt: Date }> {
  const dates: Array<{ startAt: Date; endAt: Date }> = [];
  const duration = endAt.getTime() - startAt.getTime();

  for (let i = 0; i < count; i++) {
    let newStart: Date;

    if (frequency === 'daily') {
      newStart = addDays(startAt, i);
    } else if (frequency === 'weekly') {
      newStart = addWeeks(startAt, i);
    } else {
      newStart = addMonths(startAt, i);
    }

    const newEnd = new Date(newStart.getTime() + duration);
    dates.push({ startAt: newStart, endAt: newEnd });
  }

  return dates;
}

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

    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can create hangouts' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { pupId, startAt, endAt, ownerNotes, eventName, assignedFriendUserId, repeatEnabled, repeatFrequency, repeatCount } = createHangoutSchema.parse(body);

    // Validate that pup belongs to acting user
    const pup = await prisma.pup.findUnique({
      where: { id: pupId },
    });

    if (!pup || pup.ownerUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'Pup not found or you do not own this pup' },
        { status: 403 }
      );
    }

    // If assigning to a friend, validate friendship exists
    if (assignedFriendUserId) {
      const friendship = await prisma.pupFriendship.findFirst({
        where: {
          pupId,
          friendUserId: assignedFriendUserId,
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: 'Cannot assign hangout to this friend - no friendship exists' },
          { status: 400 }
        );
      }
    }

    // Create hangout(s)
    if (repeatEnabled && repeatFrequency && repeatCount && repeatCount > 1) {
      // Create multiple hangouts for repetition
      const seriesId = crypto.randomUUID();
      const dates = generateRepeatDates(
        new Date(startAt),
        new Date(endAt),
        repeatFrequency,
        repeatCount
      );

      const hangouts = await Promise.all(
        dates.map((date, index) =>
          prisma.hangout.create({
            data: {
              pupId,
              startAt: date.startAt,
              endAt: date.endAt,
              status: assignedFriendUserId ? 'ASSIGNED' : 'OPEN',
              assignedFriendUserId,
              createdByOwnerUserId: actingUserId,
              ownerNotes,
              eventName,
              seriesId,
              seriesIndex: index,
            },
            include: {
              pup: true,
              assignedFriend: true,
              createdByOwner: true,
            },
          })
        )
      );

      // Send WhatsApp notifications to friends
      const notificationResults: NotificationResult[] = [];

      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          // Get all friends of this pup
          const friendships = await prisma.pupFriendship.findMany({
            where: { pupId },
            include: { friend: true },
          });

          // Send notification to each friend
          for (const friendship of friendships) {
            const friend = friendship.friend;

            // Skip if no valid phone number
            if (!isValidPhoneNumber(friend.phoneNumber)) {
              notificationResults.push({
                userId: friend.id,
                userName: friend.name,
                phoneNumber: friend.phoneNumber,
                status: 'skipped',
                reason: 'No valid phone number',
              });
              continue;
            }

            // Generate message using first hangout in series
            const message = generateHangoutCreatedMessage({
              friendName: friend.name,
              ownerName: actingUser.name,
              pupName: pup.name,
              startAt: hangouts[0].startAt,
              endAt: hangouts[0].endAt,
              eventName: hangouts[0].eventName,
              ownerNotes: hangouts[0].ownerNotes,
              hangoutId: hangouts[0].id,
            });

            // Send WhatsApp message
            const result = await sendWhatsAppMessage(friend.phoneNumber!, message);

            notificationResults.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
            });
          }
        } catch (error) {
          console.error('Error sending WhatsApp notifications:', error);
          // Don't fail the request if notifications fail
        }
      }

      return NextResponse.json({ hangouts, count: hangouts.length, notifications: notificationResults }, { status: 201 });
    } else {
      // Create single hangout
      const hangout = await prisma.hangout.create({
        data: {
          pupId,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          status: assignedFriendUserId ? 'ASSIGNED' : 'OPEN',
          assignedFriendUserId,
          createdByOwnerUserId: actingUserId,
          ownerNotes,
          eventName,
        },
        include: {
          pup: true,
          assignedFriend: true,
          createdByOwner: true,
        },
      });

      // Send WhatsApp notifications to friends
      const notificationResults: NotificationResult[] = [];

      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          // Get all friends of this pup
          const friendships = await prisma.pupFriendship.findMany({
            where: { pupId },
            include: { friend: true },
          });

          // Send notification to each friend
          for (const friendship of friendships) {
            const friend = friendship.friend;

            // Skip if no valid phone number
            if (!isValidPhoneNumber(friend.phoneNumber)) {
              notificationResults.push({
                userId: friend.id,
                userName: friend.name,
                phoneNumber: friend.phoneNumber,
                status: 'skipped',
                reason: 'No valid phone number',
              });
              continue;
            }

            // Generate message
            const message = generateHangoutCreatedMessage({
              friendName: friend.name,
              ownerName: actingUser.name,
              pupName: pup.name,
              startAt: hangout.startAt,
              endAt: hangout.endAt,
              eventName: hangout.eventName,
              ownerNotes: hangout.ownerNotes,
              hangoutId: hangout.id,
            });

            // Send WhatsApp message
            const result = await sendWhatsAppMessage(friend.phoneNumber!, message);

            notificationResults.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
            });
          }
        } catch (error) {
          console.error('Error sending WhatsApp notifications:', error);
          // Don't fail the request if notifications fail
        }
      }

      return NextResponse.json({ hangout, notifications: notificationResults }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
