// API Route: Bootstrap
// GET /api/bootstrap
// Returns initial data based on acting user

import { NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      // No acting user set
      return NextResponse.json({
        actingUser: null,
        accessiblePups: [],
        upcomingHangouts: [],
        pendingSuggestionsCount: 0,
      });
    }

    // Get acting user
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      include: {
        ownedPups: true,
        pupFriendships: {
          include: {
            pup: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    if (!actingUser) {
      return NextResponse.json(
        { error: 'Acting user not found' },
        { status: 404 }
      );
    }

    // Get accessible pups based on role
    let accessiblePups;
    if (actingUser.role === 'OWNER') {
      accessiblePups = actingUser.ownedPups;
    } else {
      // FRIEND - get pups they have friendships with
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessiblePups = actingUser.pupFriendships.map((friendship: any) => friendship.pup);
    }

    // Get upcoming hangouts
    const now = new Date();
    let upcomingHangouts;

    if (actingUser.role === 'OWNER') {
      // Owners see all hangouts for their pups
      upcomingHangouts = await prisma.hangout.findMany({
        where: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pupId: { in: actingUser.ownedPups.map((p: any) => p.id) },
          endAt: { gte: now },
          status: { in: ['OPEN', 'ASSIGNED'] },
        },
        include: {
          pup: true,
          assignedFriend: true,
          createdByOwner: true,
        },
        orderBy: { startAt: 'asc' },
        take: 20,
      });
    } else {
      // Friends see OPEN hangouts for their pups + assigned hangouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const friendPupIds = actingUser.pupFriendships.map((f: any) => f.pupId);
      upcomingHangouts = await prisma.hangout.findMany({
        where: {
          AND: [
            { endAt: { gte: now } },
            {
              OR: [
                {
                  // OPEN hangouts for pups they're friends with
                  AND: [
                    { pupId: { in: friendPupIds } },
                    { status: 'OPEN' },
                  ],
                },
                {
                  // Hangouts assigned to them
                  assignedFriendUserId: actingUserId,
                },
              ],
            },
          ],
        },
        include: {
          pup: true,
          assignedFriend: true,
          createdByOwner: true,
        },
        orderBy: { startAt: 'asc' },
        take: 20,
      });
    }

    // Get pending suggestions count (owners only)
    let pendingSuggestionsCount = 0;
    if (actingUser.role === 'OWNER') {
      pendingSuggestionsCount = await prisma.hangoutSuggestion.count({
        where: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pupId: { in: actingUser.ownedPups.map((p: any) => p.id) },
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      actingUser: {
        id: actingUser.id,
        name: actingUser.name,
        role: actingUser.role,
        addressText: actingUser.addressText,
      },
      accessiblePups,
      upcomingHangouts,
      pendingSuggestionsCount,
    });
  } catch (error) {
    console.error('Error in bootstrap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
