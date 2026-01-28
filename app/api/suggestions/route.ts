// API Route: Create Hangout Suggestion
// POST /api/suggestions
// Body: { pupId, startAt, endAt, friendComment? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { sendWhatsAppMessage, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { generateSuggestionCreatedMessage } from '@/lib/messageTemplates';

const createSuggestionSchema = z.object({
  pupId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  eventName: z.string().max(100).optional(),
  friendComment: z.string().optional(),
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

    if (!actingUser || actingUser.role !== 'FRIEND') {
      return NextResponse.json(
        { error: 'Only friends can suggest hangout times' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { pupId, startAt, endAt, eventName, friendComment, repeatEnabled, repeatFrequency, repeatCount } = createSuggestionSchema.parse(body);

    // Verify friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId,
        friendUserId: actingUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'You do not have permission to suggest times for this pup' },
        { status: 403 }
      );
    }

    // Create suggestion(s)
    if (repeatEnabled && repeatFrequency && repeatCount && repeatCount > 1) {
      // Create multiple suggestions for repetition
      const seriesId = crypto.randomUUID();
      const dates = generateRepeatDates(
        new Date(startAt),
        new Date(endAt),
        repeatFrequency,
        repeatCount
      );

      const suggestions = await Promise.all(
        dates.map((date, index) =>
          prisma.hangoutSuggestion.create({
            data: {
              pupId,
              suggestedByFriendUserId: actingUserId,
              startAt: date.startAt,
              endAt: date.endAt,
              status: 'PENDING',
              eventName,
              friendComment,
              seriesId,
              seriesIndex: index,
            },
            include: {
              pup: {
                include: {
                  owner: true,
                },
              },
              suggestedByFriend: true,
            },
          })
        )
      );

      // Send WhatsApp notification to owner
      const notificationResults: NotificationResult[] = [];

      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          const owner = suggestions[0].pup.owner;

          // Check if owner has valid phone number
          if (!isValidPhoneNumber(owner.phoneNumber)) {
            notificationResults.push({
              userId: owner.id,
              userName: owner.name,
              phoneNumber: owner.phoneNumber,
              status: 'skipped',
              reason: 'No valid phone number',
            });
          } else {
            // Generate message using first suggestion in series
            const message = await generateSuggestionCreatedMessage({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName: actingUser.name,
              pupName: suggestions[0].pup.name,
              startAt: suggestions[0].startAt,
              endAt: suggestions[0].endAt,
              eventName: suggestions[0].eventName,
              friendComment: suggestions[0].friendComment,
              suggestionId: suggestions[0].id,
            });

            // Send WhatsApp message
            const result = await sendWhatsAppMessage(owner.phoneNumber!, message);

            notificationResults.push({
              userId: owner.id,
              userName: owner.name,
              phoneNumber: owner.phoneNumber,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
            });
          }
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({ suggestions, count: suggestions.length, notifications: notificationResults }, { status: 201 });
    } else {
      // Create single suggestion
      const suggestion = await prisma.hangoutSuggestion.create({
        data: {
          pupId,
          suggestedByFriendUserId: actingUserId,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          status: 'PENDING',
          eventName,
          friendComment,
        },
        include: {
          pup: {
            include: {
              owner: true,
            },
          },
          suggestedByFriend: true,
        },
      });

      // Send WhatsApp notification to owner
      const notificationResults: NotificationResult[] = [];

      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          const owner = suggestion.pup.owner;

          // Check if owner has valid phone number
          if (!isValidPhoneNumber(owner.phoneNumber)) {
            notificationResults.push({
              userId: owner.id,
              userName: owner.name,
              phoneNumber: owner.phoneNumber,
              status: 'skipped',
              reason: 'No valid phone number',
            });
          } else {
            // Generate message
            const message = await generateSuggestionCreatedMessage({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName: actingUser.name,
              pupName: suggestion.pup.name,
              startAt: suggestion.startAt,
              endAt: suggestion.endAt,
              eventName: suggestion.eventName,
              friendComment: suggestion.friendComment,
              suggestionId: suggestion.id,
            });

            // Send WhatsApp message
            const result = await sendWhatsAppMessage(owner.phoneNumber!, message);

            notificationResults.push({
              userId: owner.id,
              userName: owner.name,
              phoneNumber: owner.phoneNumber,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
            });
          }
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({ suggestion, notifications: notificationResults }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
