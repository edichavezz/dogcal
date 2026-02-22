// API Route: Quick Assign Friend to Hangout
// POST /api/hangouts/:id/quick-assign
// Body: { friendUserId: string }
// Purpose: Owner assigns specific friend directly from calendar

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import {
  isValidPhoneNumber,
  isWhatsAppEnabled,
  sendWhatsAppMessage,
  type NotificationResult,
} from '@/lib/whatsapp';
import {
  generateHangoutClosedMessage,
  generateHangoutConfirmedMessage,
} from '@/lib/messageTemplates';

const quickAssignSchema = z.object({
  friendUserId: z.string().uuid(),
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

    // Get existing hangout
    const existingHangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: { include: { owner: true } },
      },
    });

    if (!existingHangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Only owner can quick-assign
    const isOwner = existingHangout.pup.ownerUserId === actingUserId;
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the pup owner can assign friends' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { friendUserId } = quickAssignSchema.parse(body);

    // Validate friendship exists
    const friendship = await prisma.pupFriendship.findFirst({
      where: {
        pupId: existingHangout.pupId,
        friendUserId,
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Cannot assign this friend - no friendship exists' },
        { status: 400 }
      );
    }

    // Update hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: {
        assignedFriendUserId: friendUserId,
        status: 'ASSIGNED',
      },
      include: {
        pup: { include: { owner: true, friendships: { include: { friend: true } } } },
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    const notificationResults: NotificationResult[] = [];

    if (isWhatsAppEnabled() && updatedHangout.assignedFriend) {
      const assignedFriend = updatedHangout.assignedFriend;
      const ownerName = updatedHangout.pup.owner.name;
      const pupName = updatedHangout.pup.name;

      if (isValidPhoneNumber(assignedFriend.phoneNumber)) {
        const message = await generateHangoutConfirmedMessage({
          friendUserId: assignedFriend.id,
          friendName: assignedFriend.name,
          ownerName,
          pupName,
          startAt: updatedHangout.startAt,
          endAt: updatedHangout.endAt,
        });

        const result = await sendWhatsAppMessage(assignedFriend.phoneNumber!, message);
        notificationResults.push({
          userId: assignedFriend.id,
          userName: assignedFriend.name,
          phoneNumber: assignedFriend.phoneNumber,
          status: result.success ? 'sent' : 'failed',
          reason: result.error,
          twilioSid: result.sid,
        });
      } else {
        notificationResults.push({
          userId: assignedFriend.id,
          userName: assignedFriend.name,
          phoneNumber: assignedFriend.phoneNumber,
          status: 'skipped',
          reason: 'No valid phone number',
        });
      }

      for (const friendship of updatedHangout.pup.friendships) {
        const friend = friendship.friend;
        if (friend.id === assignedFriend.id) continue;

        if (isValidPhoneNumber(friend.phoneNumber)) {
          const message = await generateHangoutClosedMessage({
            friendUserId: friend.id,
            friendName: friend.name,
            ownerName,
            pupName,
            startAt: updatedHangout.startAt,
            endAt: updatedHangout.endAt,
          });

          const result = await sendWhatsAppMessage(friend.phoneNumber!, message);
          notificationResults.push({
            userId: friend.id,
            userName: friend.name,
            phoneNumber: friend.phoneNumber,
            status: result.success ? 'sent' : 'failed',
            reason: result.error,
            twilioSid: result.sid,
          });
        } else {
          notificationResults.push({
            userId: friend.id,
            userName: friend.name,
            phoneNumber: friend.phoneNumber,
            status: 'skipped',
            reason: 'No valid phone number',
          });
        }

        if (updatedHangout.pup.friendships.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return NextResponse.json({ hangout: updatedHangout, notifications: notificationResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error quick-assigning hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
