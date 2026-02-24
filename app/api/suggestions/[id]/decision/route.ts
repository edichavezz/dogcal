// API Route: Approve/Reject Hangout Suggestion
// POST /api/suggestions/:id/decision
// Body: { decision: 'APPROVE' | 'REJECT', ownerComment? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppTemplate, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import {
  getSuggestionApprovedTemplateVars,
  getSuggestionRejectedTemplateVars,
  generateSuggestionApprovedMessage,
  generateSuggestionRejectedMessage,
} from '@/lib/messageTemplates';

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  ownerComment: z.string().optional(),
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

    // Get acting user
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      include: {
        ownedPups: true,
      },
    });

    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can approve/reject suggestions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { decision, ownerComment } = decisionSchema.parse(body);

    // Get suggestion — include friend so we can send WhatsApp notifications
    const suggestion = await prisma.hangoutSuggestion.findUnique({
      where: { id },
      include: {
        pup: true,
        suggestedByFriend: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Verify that acting user owns the pup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownsPup = actingUser.ownedPups.some((p: any) => p.id === suggestion.pupId);
    if (!ownsPup) {
      return NextResponse.json(
        { error: 'You do not own this pup' },
        { status: 403 }
      );
    }

    if (suggestion.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This suggestion has already been processed' },
        { status: 400 }
      );
    }

    if (decision === 'APPROVE') {
      // Create hangout assigned directly to the suggester, and mark suggestion approved
      const [hangout, updatedSuggestion] = await prisma.$transaction([
        prisma.hangout.create({
          data: {
            pupId: suggestion.pupId,
            startAt: suggestion.startAt,
            endAt: suggestion.endAt,
            eventName: suggestion.eventName,
            status: 'ASSIGNED',
            assignedFriendUserId: suggestion.suggestedByFriendUserId,
            createdByOwnerUserId: actingUserId,
            ownerNotes: ownerComment,
          },
        }),
        prisma.hangoutSuggestion.update({
          where: { id },
          data: {
            status: 'APPROVED',
            ownerDecisionByUserId: actingUserId,
            ownerDecisionAt: new Date(),
            ownerComment,
          },
        }),
      ]);

      // Notify the friend that their suggestion was approved
      const approvalNotifications: NotificationResult[] = [];
      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          const friend = suggestion.suggestedByFriend;
          if (isValidPhoneNumber(friend.phoneNumber)) {
            const [templateVars, whatsappMessage] = await Promise.all([
              getSuggestionApprovedTemplateVars({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName: actingUser.name,
                pupName: suggestion.pup.name,
                startAt: suggestion.startAt,
                endAt: suggestion.endAt,
                hangoutId: hangout.id,
              }),
              generateSuggestionApprovedMessage({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName: actingUser.name,
                pupName: suggestion.pup.name,
                startAt: suggestion.startAt,
                endAt: suggestion.endAt,
                eventName: suggestion.eventName,
                hangoutId: hangout.id,
              }),
            ]);
            const result = await sendWhatsAppTemplate(friend.phoneNumber!, 'suggestion_approved', templateVars);
            approvalNotifications.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${suggestion.pup.name}'s friend`,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
              whatsappMessage,
            });
          } else {
            approvalNotifications.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${suggestion.pup.name}'s friend`,
              status: 'skipped',
              reason: 'No valid phone number',
            });
          }
        } catch (error) {
          console.error('Error sending approval WhatsApp notification:', error);
        }
      }

      return NextResponse.json({
        suggestion: updatedSuggestion,
        hangout,
        notifications: approvalNotifications,
      });
    } else {
      // REJECT — mark the suggestion as rejected (disappears from calendar since we only query PENDING)
      const updatedSuggestion = await prisma.hangoutSuggestion.update({
        where: { id },
        data: {
          status: 'REJECTED',
          ownerDecisionByUserId: actingUserId,
          ownerDecisionAt: new Date(),
          ownerComment,
        },
        include: {
          pup: true,
          suggestedByFriend: true,
          ownerDecisionBy: true,
        },
      });

      // Notify the friend that their suggestion was rejected
      const rejectionNotifications: NotificationResult[] = [];
      if (process.env.WHATSAPP_ENABLED === 'true') {
        try {
          const friend = updatedSuggestion.suggestedByFriend;
          if (isValidPhoneNumber(friend.phoneNumber)) {
            const [templateVars, whatsappMessage] = await Promise.all([
              getSuggestionRejectedTemplateVars({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName: actingUser.name,
                pupName: updatedSuggestion.pup.name,
                startAt: updatedSuggestion.startAt,
                endAt: updatedSuggestion.endAt,
              }),
              generateSuggestionRejectedMessage({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName: actingUser.name,
                pupName: updatedSuggestion.pup.name,
                startAt: updatedSuggestion.startAt,
                endAt: updatedSuggestion.endAt,
              }),
            ]);
            const result = await sendWhatsAppTemplate(friend.phoneNumber!, 'suggestion_rejected', templateVars);
            rejectionNotifications.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${updatedSuggestion.pup.name}'s friend`,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
              whatsappMessage,
            });
          } else {
            rejectionNotifications.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${updatedSuggestion.pup.name}'s friend`,
              status: 'skipped',
              reason: 'No valid phone number',
            });
          }
        } catch (error) {
          console.error('Error sending rejection WhatsApp notification:', error);
        }
      }

      return NextResponse.json({ suggestion: updatedSuggestion, notifications: rejectionNotifications });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error processing suggestion decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
