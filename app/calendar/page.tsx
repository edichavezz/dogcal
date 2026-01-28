import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import TopNav from '@/components/TopNav';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const actingUserId = await getActingUserId();

  if (!actingUserId) {
    redirect('/');
  }

  const actingUser = await prisma.user.findUnique({
    where: { id: actingUserId },
    select: {
      id: true,
      name: true,
      role: true,
      addressText: true,
      phoneNumber: true,
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
            },
          },
        },
      },
    },
  });

  if (!actingUser) {
    redirect('/');
  }

  const now = new Date();

  // Build queries based on role - use parallel fetching with Promise.all
  if (actingUser.role === 'OWNER') {
    const pupIds = actingUser.ownedPups.map((p) => p.id);

    // Parallel fetch: hangouts and suggestions simultaneously
    const [upcomingHangouts, upcomingSuggestions] = await Promise.all([
      // Hangouts query - removed nested notes include (fetch on demand)
      prisma.hangout.findMany({
        where: {
          pupId: { in: pupIds },
          endAt: { gte: now },
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
              careInstructions: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignedFriend: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 100, // Limit to prevent unbounded queries
      }),
      // Suggestions query
      prisma.hangoutSuggestion.findMany({
        where: {
          pupId: { in: pupIds },
          status: 'PENDING',
          endAt: { gte: now },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          friendComment: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          suggestedByFriend: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 50,
      }),
    ]);

    // Add empty notes array for compatibility with CalendarView type
    const hangoutsWithEmptyNotes = upcomingHangouts.map((h) => ({
      ...h,
      notes: [],
    }));

    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav user={actingUser} />

        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            <div className="flex-shrink-0 mb-4">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Calendar
              </h1>
              <p className="text-sm text-slate-600">
                View and manage hangouts for your pups
              </p>
            </div>

            <div className="flex-1 min-h-0">
              <CalendarClient
                hangouts={hangoutsWithEmptyNotes}
                suggestions={upcomingSuggestions}
                actingUserId={actingUserId}
                actingUserRole={actingUser.role}
              />
            </div>
          </div>
        </main>
      </div>
    );
  } else {
    // FRIEND role
    const friendPupIds = actingUser.pupFriendships.map((f) => f.pupId);

    // Parallel fetch: hangouts and suggestions simultaneously
    const [upcomingHangouts, upcomingSuggestions] = await Promise.all([
      // Hangouts query for friends
      prisma.hangout.findMany({
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
              careInstructions: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignedFriend: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 100,
      }),
      // Suggestions query for friends
      prisma.hangoutSuggestion.findMany({
        where: {
          suggestedByFriendUserId: actingUserId,
          status: 'PENDING',
          endAt: { gte: now },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          friendComment: true,
          pup: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          suggestedByFriend: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 50,
      }),
    ]);

    // Add empty notes array for compatibility with CalendarView type
    const hangoutsWithEmptyNotes = upcomingHangouts.map((h) => ({
      ...h,
      notes: [],
    }));

    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav user={actingUser} />

        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            <div className="flex-shrink-0 mb-4">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Calendar
              </h1>
              <p className="text-sm text-slate-600">
                View available hangouts and your upcoming commitments
              </p>
            </div>

            <div className="flex-1 min-h-0">
              <CalendarClient
                hangouts={hangoutsWithEmptyNotes}
                suggestions={upcomingSuggestions}
                actingUserId={actingUserId}
                actingUserRole={actingUser.role}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }
}
