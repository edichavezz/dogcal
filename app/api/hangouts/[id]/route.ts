// API Route: Get, Update, and Delete Hangout Details
// GET /api/hangouts/:id
// PATCH /api/hangouts/:id
// DELETE /api/hangouts/:id

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import {
  isWhatsAppEnabled,
  isValidPhoneNumber,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  NotificationResult,
} from '@/lib/whatsapp';
import {
  generateHangoutRescheduledMessage,
  generateHangoutClosedMessage,
  generateHangoutConfirmedMessage,
  getHangoutDeletedTemplateVars,
  getHangoutCancelledTemplateVars,
  generateHangoutDeletedMessage,
  generateHangoutCancelledMessage,
} from '@/lib/messageTemplates';

const updateHangoutSchema = z.object({
  eventName: z.string().max(100).optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  ownerNotes: z.string().optional().nullable(),
  assignedFriendUserId: z.string().uuid().optional().nullable(),
});

export async function GET(
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

    // Get hangout with all related data
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: {
          include: {
            owner: true,
            friendships: {
              include: { friend: { select: { id: true, name: true } } },
            },
          },
        },
        assignedFriend: true,
        createdByOwner: true,
        notes: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        responses: {
          include: {
            responder: true,
          },
          orderBy: {
            respondedAt: 'desc',
          },
        },
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ hangout });

    // Add cache headers for browser caching
    response.headers.set(
      'Cache-Control',
      'private, max-age=60, stale-while-revalidate=120'
    );

    return response;
  } catch (error) {
    console.error('Error fetching hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        pup: { include: { owner: true, friendships: { include: { friend: true } } } },
        assignedFriend: true,
      },
    });

    if (!existingHangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const updates = updateHangoutSchema.parse(body);

    // Check permissions
    const isOwner = existingHangout.pup.ownerUserId === actingUserId;
    const isAssignedFriend = existingHangout.assignedFriendUserId === actingUserId;

    // Only owner can change eventName, ownerNotes, or assignedFriendUserId
    if ((updates.eventName !== undefined || updates.ownerNotes !== undefined || updates.assignedFriendUserId !== undefined) && !isOwner) {
      return NextResponse.json(
        { error: 'Only the pup owner can update event details and assignment' },
        { status: 403 }
      );
    }

    // Only owner or assigned friend can reschedule
    if ((updates.startAt || updates.endAt) && !isOwner && !isAssignedFriend) {
      return NextResponse.json(
        { error: 'Only the pup owner or assigned friend can reschedule' },
        { status: 403 }
      );
    }

    // Validate time range if updating times
    const newStartAt = updates.startAt ? new Date(updates.startAt) : existingHangout.startAt;
    const newEndAt = updates.endAt ? new Date(updates.endAt) : existingHangout.endAt;

    if (newStartAt >= newEndAt) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Run validation queries in parallel for better performance
    const needsConflictCheck = updates.startAt || updates.endAt;
    const needsFriendshipCheck = updates.assignedFriendUserId !== undefined && updates.assignedFriendUserId;

    const [conflictingHangout, friendship] = await Promise.all([
      // Check for time conflicts (only if times are changing)
      needsConflictCheck
        ? prisma.hangout.findFirst({
            where: {
              pupId: existingHangout.pupId,
              id: { not: id },
              status: { in: ['OPEN', 'ASSIGNED'] },
              OR: [
                // New hangout starts during existing hangout
                {
                  AND: [
                    { startAt: { lte: newStartAt } },
                    { endAt: { gt: newStartAt } },
                  ],
                },
                // New hangout ends during existing hangout
                {
                  AND: [
                    { startAt: { lt: newEndAt } },
                    { endAt: { gte: newEndAt } },
                  ],
                },
                // New hangout completely contains existing hangout
                {
                  AND: [
                    { startAt: { gte: newStartAt } },
                    { endAt: { lte: newEndAt } },
                  ],
                },
              ],
            },
            select: { id: true },
          })
        : null,
      // Validate friendship (only if changing assignment)
      needsFriendshipCheck
        ? prisma.pupFriendship.findFirst({
            where: {
              pupId: existingHangout.pupId,
              friendUserId: updates.assignedFriendUserId!,
            },
            select: { id: true },
          })
        : null,
    ]);

    if (needsConflictCheck && conflictingHangout) {
      return NextResponse.json(
        { error: 'This time slot conflicts with another hangout for this pup' },
        { status: 400 }
      );
    }

    if (needsFriendshipCheck && !friendship) {
      return NextResponse.json(
        { error: 'Cannot assign to this friend - no friendship exists' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Prisma.HangoutUncheckedUpdateInput = {};
    if (updates.eventName !== undefined) updateData.eventName = updates.eventName;
    if (updates.ownerNotes !== undefined) updateData.ownerNotes = updates.ownerNotes;
    if (updates.startAt) updateData.startAt = newStartAt;
    if (updates.endAt) updateData.endAt = newEndAt;
    const timesActuallyChanged =
      (updates.startAt && new Date(updates.startAt).getTime() !== existingHangout.startAt.getTime()) ||
      (updates.endAt && new Date(updates.endAt).getTime() !== existingHangout.endAt.getTime());

    // Only update assignment if explicitly provided — time edits alone do NOT unassign
    if (updates.assignedFriendUserId !== undefined) {
      updateData.assignedFriendUserId = updates.assignedFriendUserId;
      updateData.status = updates.assignedFriendUserId ? 'ASSIGNED' : 'OPEN';
    }

    // Update hangout
    const updatedHangout = await prisma.hangout.update({
      where: { id },
      data: updateData,
      include: {
        pup: { include: { owner: true, friendships: { include: { friend: true } } } },
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    const notificationResults: NotificationResult[] = [];

    const isNewAssignment = updates.assignedFriendUserId
      && updates.assignedFriendUserId !== existingHangout.assignedFriendUserId;

    // Notify the assigned friend when the owner reschedules (but keeps them assigned)
    const isRescheduleOfAssigned = !!timesActuallyChanged
      && existingHangout.status === 'ASSIGNED'
      && !!existingHangout.assignedFriendUserId
      && !isNewAssignment;

    if (isWhatsAppEnabled() && isRescheduleOfAssigned && existingHangout.assignedFriend) {
      const friend = existingHangout.assignedFriend;

      if (isValidPhoneNumber(friend.phoneNumber)) {
        const message = await generateHangoutRescheduledMessage({
          friendUserId: friend.id,
          friendName: friend.name,
          ownerName: existingHangout.pup.owner.name,
          pupName: existingHangout.pup.name,
          startAt: newStartAt,
          endAt: newEndAt,
          hangoutId: existingHangout.id,
        });

        const result = await sendWhatsAppMessage(friend.phoneNumber!, message);

        notificationResults.push({
          userId: friend.id,
          userName: friend.name,
          phoneNumber: friend.phoneNumber,
          profilePhotoUrl: friend.profilePhotoUrl,
          relationship: `${existingHangout.pup.name}'s friend`,
          status: result.success ? 'sent' : 'failed',
          reason: result.error,
          twilioSid: result.sid,
          whatsappMessage: message,
        });
      } else {
        const whatsappMessage = await generateHangoutRescheduledMessage({
          friendUserId: friend.id,
          friendName: friend.name,
          ownerName: existingHangout.pup.owner.name,
          pupName: existingHangout.pup.name,
          startAt: newStartAt,
          endAt: newEndAt,
          hangoutId: existingHangout.id,
        });
        notificationResults.push({
          userId: friend.id,
          userName: friend.name,
          phoneNumber: friend.phoneNumber,
          profilePhotoUrl: friend.profilePhotoUrl,
          relationship: `${existingHangout.pup.name}'s friend`,
          status: 'skipped',
          reason: 'No valid phone number',
          whatsappMessage,
        });
      }
    }

    if (isWhatsAppEnabled() && isNewAssignment && updatedHangout.assignedFriend) {
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
          profilePhotoUrl: assignedFriend.profilePhotoUrl,
          relationship: `${pupName}'s friend`,
          status: result.success ? 'sent' : 'failed',
          reason: result.error,
          twilioSid: result.sid,
          whatsappMessage: message,
        });
      } else {
        const whatsappMessage = await generateHangoutConfirmedMessage({
          friendUserId: assignedFriend.id,
          friendName: assignedFriend.name,
          ownerName,
          pupName,
          startAt: updatedHangout.startAt,
          endAt: updatedHangout.endAt,
        });
        notificationResults.push({
          userId: assignedFriend.id,
          userName: assignedFriend.name,
          phoneNumber: assignedFriend.phoneNumber,
          profilePhotoUrl: assignedFriend.profilePhotoUrl,
          relationship: `${pupName}'s friend`,
          status: 'skipped',
          reason: 'No valid phone number',
          whatsappMessage,
        });
      }

    }

    return NextResponse.json({ hangout: updatedHangout, notificationResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get hangout with related data for notifications
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: {
        pup: {
          include: {
            owner: true,
            friendships: {
              include: {
                friend: true,
              },
            },
          },
        },
        assignedFriend: true,
        createdByOwner: true,
      },
    });

    if (!hangout) {
      return NextResponse.json(
        { error: 'Hangout not found' },
        { status: 404 }
      );
    }

    // Only the pup owner can delete hangouts
    const isOwner = hangout.pup.ownerUserId === actingUserId;
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the pup owner can delete hangouts' },
        { status: 403 }
      );
    }

    // Delete the hangout (notes cascade automatically)
    await prisma.hangout.delete({
      where: { id },
    });

    // Send WhatsApp notifications
    const notificationResults: NotificationResult[] = [];

    if (isWhatsAppEnabled()) {
      const ownerName = hangout.pup.owner.name;
      const pupName = hangout.pup.name;

      if (hangout.status === 'ASSIGNED' && hangout.assignedFriend) {
        // Notify the assigned friend that their hangout was cancelled
        const friend = hangout.assignedFriend;

        if (isValidPhoneNumber(friend.phoneNumber)) {
          const [templateVars, whatsappMessage] = await Promise.all([
            getHangoutCancelledTemplateVars({
              friendUserId: friend.id,
              friendName: friend.name,
              ownerName,
              pupName,
              startAt: hangout.startAt,
              endAt: hangout.endAt,
            }),
            generateHangoutCancelledMessage({
              friendUserId: friend.id,
              friendName: friend.name,
              ownerName,
              pupName,
              startAt: hangout.startAt,
              endAt: hangout.endAt,
            }),
          ]);

          const result = await sendWhatsAppTemplate(
            friend.phoneNumber!,
            'hangout_cancelled',
            templateVars
          );

          notificationResults.push({
            userId: friend.id,
            userName: friend.name,
            phoneNumber: friend.phoneNumber,
            profilePhotoUrl: friend.profilePhotoUrl,
            relationship: `${pupName}'s friend`,
            status: result.success ? 'sent' : 'failed',
            reason: result.error,
            twilioSid: result.sid,
            whatsappMessage,
          });
        } else {
          const whatsappMessage = await generateHangoutCancelledMessage({
            friendUserId: friend.id,
            friendName: friend.name,
            ownerName,
            pupName,
            startAt: hangout.startAt,
            endAt: hangout.endAt,
          });
          notificationResults.push({
            userId: friend.id,
            userName: friend.name,
            phoneNumber: friend.phoneNumber,
            profilePhotoUrl: friend.profilePhotoUrl,
            relationship: `${pupName}'s friend`,
            status: 'skipped',
            reason: 'No valid phone number',
            whatsappMessage,
          });
        }
      } else if (hangout.status === 'OPEN') {
        // Notify all pup friends that the open hangout was deleted
        for (const friendship of hangout.pup.friendships) {
          const friend = friendship.friend;

          if (isValidPhoneNumber(friend.phoneNumber)) {
            const [templateVars, whatsappMessage] = await Promise.all([
              getHangoutDeletedTemplateVars({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName,
                pupName,
                startAt: hangout.startAt,
                endAt: hangout.endAt,
              }),
              generateHangoutDeletedMessage({
                friendUserId: friend.id,
                friendName: friend.name,
                ownerName,
                pupName,
                startAt: hangout.startAt,
                endAt: hangout.endAt,
              }),
            ]);

            const result = await sendWhatsAppTemplate(
              friend.phoneNumber!,
              'hangout_deleted',
              templateVars
            );

            notificationResults.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${pupName}'s friend`,
              status: result.success ? 'sent' : 'failed',
              reason: result.error,
              twilioSid: result.sid,
              whatsappMessage,
            });
          } else {
            const whatsappMessage = await generateHangoutDeletedMessage({
              friendUserId: friend.id,
              friendName: friend.name,
              ownerName,
              pupName,
              startAt: hangout.startAt,
              endAt: hangout.endAt,
            });
            notificationResults.push({
              userId: friend.id,
              userName: friend.name,
              phoneNumber: friend.phoneNumber,
              profilePhotoUrl: friend.profilePhotoUrl,
              relationship: `${pupName}'s friend`,
              status: 'skipped',
              reason: 'No valid phone number',
              whatsappMessage,
            });
          }

          // Add small delay between messages to avoid rate limiting
          if (hangout.pup.friendships.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hangout deleted successfully',
      notificationResults,
    });
  } catch (error) {
    console.error('Error deleting hangout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
