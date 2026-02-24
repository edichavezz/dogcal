// API Route: Assign Friend to Hangout
// POST /api/hangouts/:id/assign

import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppTemplate, isValidPhoneNumber, type NotificationResult } from '@/lib/whatsapp';
import { getHangoutAssignedTemplateVars, generateHangoutAssignedMessage } from '@/lib/messageTemplates';

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
    });

    if (!actingUser || actingUser.role !== 'FRIEND') {
      return NextResponse.json(
        { error: 'Only friends can assign themselves to hangouts' },
        { status: 403 }
      );
    }

    // Get hangout
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: true,
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    if (hangout.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Hangout is not available (already assigned or completed)' },
        { status: 400 }
      );
    }

    // Verify friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId: hangout.pupId,
        friendUserId: actingUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'You do not have permission to care for this pup' },
        { status: 403 }
      );
    }

    // Assign hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: actingUserId,
        status: 'ASSIGNED',
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
            profilePhotoUrl: owner.profilePhotoUrl,
            relationship: `${updatedHangout.pup.name}'s owner`,
            status: 'skipped',
            reason: 'No valid phone number',
          });
        } else {
          const [templateVars, whatsappMessage] = await Promise.all([
            getHangoutAssignedTemplateVars({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName: actingUser.name,
              pupName: updatedHangout.pup.name,
              startAt: updatedHangout.startAt,
              endAt: updatedHangout.endAt,
            }),
            generateHangoutAssignedMessage({
              ownerUserId: owner.id,
              ownerName: owner.name,
              friendName: actingUser.name,
              pupName: updatedHangout.pup.name,
              startAt: updatedHangout.startAt,
              endAt: updatedHangout.endAt,
              eventName: updatedHangout.eventName,
              hangoutId: updatedHangout.id,
            }),
          ]);

          const result = await sendWhatsAppTemplate(owner.phoneNumber!, 'hangout_assigned', templateVars);

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
    console.error('Error assigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
