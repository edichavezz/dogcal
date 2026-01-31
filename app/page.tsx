import { getActingUserId } from './lib/cookies';
import { prisma } from './lib/prisma';
import WelcomeScreen from './components/WelcomeScreen';
import TokenLoginForm from './admin/TokenLoginForm';

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
    include: {
      ownedPups: {
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
        },
      },
      pupFriendships: {
        include: {
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
    // OWNER: Upcoming hangouts for their pups + pending suggestions
    const [upcomingHangouts, upcomingHangoutsTotal, pendingSuggestions] = await Promise.all([
      prisma.hangout.findMany({
        where: {
          pupId: { in: pupIds },
          endAt: { gte: now },
          status: { in: ['OPEN', 'ASSIGNED'] },
        },
        orderBy: { startAt: 'asc' },
        // Fetch more to account for filtering recurring hangouts
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          ownerNotes: true,
          seriesId: true,
          seriesIndex: true,
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
              profilePhotoUrl: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              noteText: true,
              createdAt: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      // Note: Total count is calculated after filtering below
      prisma.hangoutSuggestion.findMany({
        where: {
          pupId: { in: pupIds },
          status: 'PENDING',
          endAt: { gte: now },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
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

    return (
      <WelcomeScreen
        user={user}
        upcomingHangouts={upcomingHangouts.map(h => ({
          ...h,
          startAt: h.startAt.toISOString(),
          endAt: h.endAt.toISOString(),
          seriesId: h.seriesId,
          seriesIndex: h.seriesIndex,
          notes: h.notes.map(n => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          })),
        }))}
        upcomingHangoutsTotal={upcomingHangoutsTotal}
        pendingSuggestions={pendingSuggestions.map(s => ({
          ...s,
          startAt: s.startAt.toISOString(),
          endAt: s.endAt.toISOString(),
        }))}
        availableHangouts={[]}
        availableHangoutsTotal={0}
        myHangoutsAndSuggestions={[]}
        myHangoutsTotal={0}
      />
    );
  } else {
    // FRIEND: Available (OPEN) hangouts they can claim + their assigned hangouts + their suggestions
    const [availableHangouts, availableHangoutsTotal, myAssignedHangouts, myAssignedHangoutsTotal, mySuggestions] = await Promise.all([
      prisma.hangout.findMany({
        where: {
          pupId: { in: pupIds },
          endAt: { gte: now },
          status: 'OPEN',
          seriesId: null, // Hide recurring hangouts by default
        },
        orderBy: { startAt: 'asc' },
        take: 5, // Initial page load - fetch only 5
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          ownerNotes: true,
          seriesId: true,
          seriesIndex: true,
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
              profilePhotoUrl: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              noteText: true,
              createdAt: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.hangout.count({
        where: {
          pupId: { in: pupIds },
          endAt: { gte: now },
          status: 'OPEN',
          seriesId: null, // Hide recurring hangouts by default
        },
      }),
      prisma.hangout.findMany({
        where: {
          assignedFriendUserId: actingUserId,
          endAt: { gte: now },
          status: 'ASSIGNED',
          seriesId: null, // Hide recurring hangouts by default
        },
        orderBy: { startAt: 'asc' },
        take: 5, // Initial page load - fetch only 5
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          eventName: true,
          ownerNotes: true,
          seriesId: true,
          seriesIndex: true,
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
              profilePhotoUrl: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              noteText: true,
              createdAt: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.hangout.count({
        where: {
          assignedFriendUserId: actingUserId,
          endAt: { gte: now },
          status: 'ASSIGNED',
          seriesId: null, // Hide recurring hangouts by default
        },
      }),
      prisma.hangoutSuggestion.findMany({
        where: {
          suggestedByFriendUserId: actingUserId,
          status: 'PENDING',
          endAt: { gte: now },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
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

    return (
      <WelcomeScreen
        user={user}
        upcomingHangouts={[]}
        upcomingHangoutsTotal={0}
        pendingSuggestions={[]}
        availableHangouts={availableHangouts.map(h => ({
          ...h,
          startAt: h.startAt.toISOString(),
          endAt: h.endAt.toISOString(),
          seriesId: h.seriesId,
          seriesIndex: h.seriesIndex,
          notes: h.notes.map(n => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          })),
        }))}
        availableHangoutsTotal={availableHangoutsTotal}
        myHangoutsAndSuggestions={{
          hangouts: myAssignedHangouts.map(h => ({
            ...h,
            startAt: h.startAt.toISOString(),
            endAt: h.endAt.toISOString(),
            seriesId: h.seriesId,
            seriesIndex: h.seriesIndex,
            notes: h.notes.map(n => ({
              ...n,
              createdAt: n.createdAt.toISOString(),
            })),
          })),
          suggestions: mySuggestions.map(s => ({
            ...s,
            startAt: s.startAt.toISOString(),
            endAt: s.endAt.toISOString(),
          })),
        }}
        myHangoutsTotal={myAssignedHangoutsTotal}
      />
    );
  }
}
