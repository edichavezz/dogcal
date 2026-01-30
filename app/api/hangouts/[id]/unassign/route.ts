// API Route: Unassign Friend from Hangout
// POST /api/hangouts/:id/unassign

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { generateHangoutUnassignedMessage } from '@/lib/messageTemplates';

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

    // Get hangout
    const hangout = await prisma.hangout.findUnique({
      where: { id },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Verify that acting user is the assigned friend
    if (hangout.assignedFriendUserId !== actingUserId) {
      return NextResponse.json(
        { error: 'You are not assigned to this hangout' },
        { status: 403 }
      );
    }

    // Get the friend's name before unassigning (for notification)
    const friendUser = await prisma.user.findUnique({
      where: { id: actingUserId },
    });

    // Unassign hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: null,
        status: 'OPEN',
      },
      include: {
        pup: true,
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    // Send WhatsApp notification to owner
    const notificationResults: NotificationResult[] = [];

    if (process.env.WHATSAPP_ENABLED === 'true') {
      try {
        const owner = updatedHangout.createdByOwner;

        if (!isValidPhoneNumber(owner.phoneNumber)) {
          notificationResults.push({
            userId: owner.id,
            userName: owner.name,
            phoneNumber: owner.phoneNumber,
            status: 'skipped',
            reason: 'No valid phone number',
          });
        } else {
          const message = await generateHangoutUnassignedMessage({
            ownerUserId: owner.id,
            ownerName: owner.name,
            friendName: friendUser?.name || 'A friend',
            pupName: updatedHangout.pup.name,
            startAt: updatedHangout.startAt,
            endAt: updatedHangout.endAt,
            eventName: updatedHangout.eventName,
            hangoutId: updatedHangout.id,
          });

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
      }
    }

    return NextResponse.json({ hangout: updatedHangout, notifications: notificationResults });
  } catch (error) {
    console.error('Error unassigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
