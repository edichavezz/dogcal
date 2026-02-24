// API Route: Unassign Friend from Hangout
// POST /api/hangouts/:id/unassign

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppTemplate, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { getHangoutUnassignedTemplateVars, generateHangoutUnassignedMessage } from '@/lib/messageTemplates';

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
          const whatsappMessage = await generateHangoutUnassignedMessage({
            ownerUserId: owner.id,
            ownerName: owner.name,
            friendName: friendUser?.name || 'A friend',
            pupName: updatedHangout.pup.name,
            startAt: updatedHangout.startAt,
            endAt: updatedHangout.endAt,
            eventName: updatedHangout.eventName,
            hangoutId: updatedHangout.id,
          });
          notificationResults.push({
            userId: owner.id,
            userName: owner.name,
            phoneNumber: owner.phoneNumber,
            profilePhotoUrl: owner.profilePhotoUrl,
            relationship: `${updatedHangout.pup.name}'s owner`,
            status: 'skipped',
            reason: 'No valid phone number',
            whatsappMessage,
          });
        } else {
          const friendName = friendUser?.name || 'A friend';
          const [templateVars, whatsappMessage] = await Promise.all([
            getHangoutUnassignedTemplateVars({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName,
              pupName: updatedHangout.pup.name,
              startAt: updatedHangout.startAt,
              endAt: updatedHangout.endAt,
            }),
            generateHangoutUnassignedMessage({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName,
              pupName: updatedHangout.pup.name,
              startAt: updatedHangout.startAt,
              endAt: updatedHangout.endAt,
              eventName: updatedHangout.eventName,
              hangoutId: updatedHangout.id,
            }),
          ]);

          const result = await sendWhatsAppTemplate(owner.phoneNumber!, 'hangout_unassigned', templateVars);

          notificationResults.push({
            userId: owner.id,
            userName: owner.name,
            phoneNumber: owner.phoneNumber,
            profilePhotoUrl: owner.profilePhotoUrl,
            relationship: `${updatedHangout.pup.name}'s owner`,
            status: result.success ? 'sent' : 'failed',
            reason: result.error,
            twilioSid: result.sid,
            whatsappMessage,
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
