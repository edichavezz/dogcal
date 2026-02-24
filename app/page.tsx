import { getActingUserId } from './lib/cookies';
import { prisma } from './lib/prisma';
import WelcomeScreen from './components/WelcomeScreen';
import TokenLoginForm from './admin/TokenLoginForm';
import type { Prisma } from '@prisma/client';

const HOME_PAGE_SIZE = 5;
const HOME_FETCH_LIMIT = 120;

// Helper to filter recurring hangouts, keeping only the first of each series
function filterFirstOfSeries<T extends { seriesId: string | null }>(hangouts: T[]): T[] {
  const seenSeries = new Set<string>();
  return hangouts.filter(h => {
    if (!h.seriesId) return true; // Non-recurring events always shown
    if (seenSeries.has(h.seriesId)) return false;
    seenSeries.add(h.seriesId);
    return true;
  });
}

async function countUniqueHangouts(where: Prisma.HangoutWhereInput): Promise<number> {
  const [nonRecurringCount, recurringSeries] = await Promise.all([
    prisma.hangout.count({
      where: {
        ...where,
        seriesId: null,
      },
    }),
    prisma.hangout.groupBy({
      by: ['seriesId'],
      where: {
        ...where,
        seriesId: { not: null },
      },
    }),
  ]);

  return nonRecurringCount + recurringSeries.length;
}

function toIsoHangoutSummary<T extends { startAt: Date; endAt: Date }>(
  hangout: T
): Omit<T, 'startAt' | 'endAt'> & { startAt: string; endAt: string } {
  return {
    ...hangout,
    startAt: hangout.startAt.toISOString(),
    endAt: hangout.endAt.toISOString(),
  };
}

export default async function Home() {
  const actingUserId = await getActingUserId();

  // Not logged in - show login form
  if (!actingUserId) {
    return <TokenLoginForm />;
  }

  const now = new Date();

  // Fetch user first to determine role
  const user = await prisma.user.findUnique({
    where: { id: actingUserId },
    select: {
      id: true,
      name: true,
      role: true,
      profilePhotoUrl: true,
      ownedPups: {
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
          friendships: {
            select: {
              friend: {
                select: { id: true, name: true, profilePhotoUrl: true },
              },
            },
          },
        },
      },
      pupFriendships: {
        select: {
          id: true,
          pupId: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
              ownerUserId: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    // User not found - this shouldn't happen, but handle gracefully
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  const isOwner = user.role === 'OWNER';

  // Get pup IDs based on role
  const pupIds = isOwner
    ? user.ownedPups.map(p => p.id)
    : user.pupFriendships.map(f => f.pup.id);

  // Fetch hangouts and suggestions in parallel based on role
  if (isOwner) {
    const ownerHangoutWhere: Prisma.HangoutWhereInput = {
      pupId: { in: pupIds },
      endAt: { gte: now },
      status: { in: ['OPEN', 'ASSIGNED'] },
    };

    const friendPupIds = user.pupFriendships.map((f) => f.pupId);

    // OWNER: Upcoming hangouts for their pups + pending suggestions + owner's own submitted suggestions
    const [allUpcomingHangouts, upcomingHangoutsTotal, pendingSuggestions, mySubmittedSuggestions] = await Promise.all([
      prisma.hangout.findMany({
        where: ownerHangoutWhere,
        orderBy: { startAt: 'asc' },
        // Fetch enough candidates for de-duplication but keep payload bounded
        take: HOME_FETCH_LIMIT,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          seriesId: true,
          seriesIndex: true,
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
        },
      }),
      countUniqueHangouts(ownerHangoutWhere),
      prisma.hangoutSuggestion.findMany({
        where: {
          pupId: { in: pupIds },
          status: 'PENDING',
          endAt: { gte: now },
        },
        orderBy: { startAt: 'asc' },
        take: HOME_PAGE_SIZE,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          eventName: true,
          friendComment: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
          suggestedByFriend: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
      // Suggestions submitted by this owner for friend pups
      friendPupIds.length > 0
        ? prisma.hangoutSuggestion.findMany({
            where: {
              suggestedByFriendUserId: actingUserId,
              status: 'PENDING',
              endAt: { gte: now },
            },
            orderBy: { startAt: 'asc' },
            take: HOME_PAGE_SIZE,
            select: {
              id: true,
              startAt: true,
              endAt: true,
              eventName: true,
              friendComment: true,
              pup: {
                select: {
                  id: true,
                  name: true,
                  profilePhotoUrl: true,
                },
              },
              suggestedByFriend: {
                select: {
                  id: true,
                  name: true,
                  profilePhotoUrl: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Filter to show only the first of each recurring series, then take 5
    const filteredUpcoming = filterFirstOfSeries(allUpcomingHangouts);
    const upcomingHangouts = filteredUpcoming.slice(0, HOME_PAGE_SIZE);

    const friendPups = user.pupFriendships.map(f => ({
      ...f.pup,
      owner: f.pup.owner,
    }));

    const userWithFriends = {
      ...user,
      ownedPups: user.ownedPups.map(pup => ({
        ...pup,
        friends: pup.friendships.map(f => f.friend),
      })),
    };

    return (
      <WelcomeScreen
        user={userWithFriends}
        upcomingHangouts={upcomingHangouts.map(toIsoHangoutSummary)}
        upcomingHangoutsTotal={upcomingHangoutsTotal}
        pendingSuggestions={pendingSuggestions.map(s => ({
          ...s,
          startAt: s.startAt.toISOString(),
          endAt: s.endAt.toISOString(),
        }))}
        mySubmittedSuggestions={mySubmittedSuggestions.map(s => ({
          ...s,
          startAt: s.startAt.toISOString(),
          endAt: s.endAt.toISOString(),
        }))}
        availableHangouts={[]}
        availableHangoutsTotal={0}
        myHangoutsAndSuggestions={[]}
        myHangoutsTotal={0}
        friendPups={friendPups}
      />
    );
  } else {
    const availableHangoutWhere: Prisma.HangoutWhereInput = {
      pupId: { in: pupIds },
      endAt: { gte: now },
      status: 'OPEN',
    };
    const assignedHangoutWhere: Prisma.HangoutWhereInput = {
      assignedFriendUserId: actingUserId,
      endAt: { gte: now },
      status: 'ASSIGNED',
    };

    // FRIEND: Available (OPEN) hangouts they can claim + their assigned hangouts + their suggestions
    const [
      allAvailableHangouts,
      allMyAssignedHangouts,
      availableHangoutsTotal,
      myHangoutsTotal,
      mySuggestions,
    ] = await Promise.all([
      prisma.hangout.findMany({
        where: availableHangoutWhere,
        orderBy: { startAt: 'asc' },
        take: HOME_FETCH_LIMIT,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          seriesId: true,
          seriesIndex: true,
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
        },
      }),
      prisma.hangout.findMany({
        where: assignedHangoutWhere,
        orderBy: { startAt: 'asc' },
        take: HOME_FETCH_LIMIT,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          seriesId: true,
          seriesIndex: true,
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
        },
      }),
      countUniqueHangouts(availableHangoutWhere),
      countUniqueHangouts(assignedHangoutWhere),
      prisma.hangoutSuggestion.findMany({
        where: {
          suggestedByFriendUserId: actingUserId,
          status: 'PENDING',
          endAt: { gte: now },
        },
        orderBy: { startAt: 'asc' },
        take: HOME_PAGE_SIZE,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          eventName: true,
          friendComment: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
          suggestedByFriend: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
    ]);

    // Filter to show only the first of each recurring series, then take 5
    const filteredAvailable = filterFirstOfSeries(allAvailableHangouts);
    const availableHangouts = filteredAvailable.slice(0, HOME_PAGE_SIZE);

    const filteredMyAssigned = filterFirstOfSeries(allMyAssignedHangouts);
    const myAssignedHangouts = filteredMyAssigned.slice(0, HOME_PAGE_SIZE);

    return (
      <WelcomeScreen
        user={user}
        upcomingHangouts={[]}
        upcomingHangoutsTotal={0}
        pendingSuggestions={[]}
        availableHangouts={availableHangouts.map(toIsoHangoutSummary)}
        availableHangoutsTotal={availableHangoutsTotal}
        myHangoutsAndSuggestions={{
          hangouts: myAssignedHangouts.map(toIsoHangoutSummary),
          suggestions: mySuggestions.map(s => ({
            ...s,
            startAt: s.startAt.toISOString(),
            endAt: s.endAt.toISOString(),
          })),
        }}
        myHangoutsTotal={myHangoutsTotal}
      />
    );
  }
}
