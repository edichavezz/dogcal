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

    // Get acting user with optimized select - only fetch what we need
    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      select: {
        id: true,
        name: true,
        role: true,
        addressText: true,
        ownedPups: {
          select: {
            id: true,
            name: true,
            profilePhotoUrl: true,
          },
        },
        pupFriendships: {
          select: {
            pupId: true,
            pup: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
                ownerUserId: true,
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
      accessiblePups = actingUser.pupFriendships.map((friendship) => friendship.pup);
    }

    const now = new Date();

    // Build queries based on role and execute in parallel
    if (actingUser.role === 'OWNER') {
      const pupIds = actingUser.ownedPups.map((p) => p.id);

      // Parallel fetch: hangouts and suggestions count
      const [upcomingHangouts, pendingSuggestionsCount] = await Promise.all([
        prisma.hangout.findMany({
          where: {
            pupId: { in: pupIds },
            endAt: { gte: now },
            status: { in: ['OPEN', 'ASSIGNED'] },
          },
          select: {
            id: true,
            startAt: true,
            endAt: true,
            status: true,
            ownerNotes: true,
            eventName: true,
            pup: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
              },
            },
            assignedFriend: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
              },
            },
            createdByOwner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { startAt: 'asc' },
          take: 20,
        }),
        prisma.hangoutSuggestion.count({
          where: {
            pupId: { in: pupIds },
            status: 'PENDING',
          },
        }),
      ]);

      const response = NextResponse.json({
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

      response.headers.set(
        'Cache-Control',
        'private, max-age=60, stale-while-revalidate=120'
      );

      return response;
    } else {
      // FRIEND role - no suggestions count needed
      const friendPupIds = actingUser.pupFriendships.map((f) => f.pupId);

      const upcomingHangouts = await prisma.hangout.findMany({
        where: {
          AND: [
            { endAt: { gte: now } },
            {
              OR: [
                {
                  AND: [
                    { pupId: { in: friendPupIds } },
                    { status: 'OPEN' },
                  ],
                },
                {
                  assignedFriendUserId: actingUserId,
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          ownerNotes: true,
          eventName: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
          assignedFriend: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
          createdByOwner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 20,
      });

      const response = NextResponse.json({
        actingUser: {
          id: actingUser.id,
          name: actingUser.name,
          role: actingUser.role,
          addressText: actingUser.addressText,
        },
        accessiblePups,
        upcomingHangouts,
        pendingSuggestionsCount: 0,
      });

      response.headers.set(
        'Cache-Control',
        'private, max-age=60, stale-while-revalidate=120'
      );

      return response;
    }
  } catch (error) {
    console.error('Error in bootstrap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
