import { getActingUserId } from './lib/cookies';
import { prisma } from './lib/prisma';
import WelcomeScreen from './components/WelcomeScreen';
import PawsIcon from './components/PawsIcon';

export default async function Home() {
  const actingUserId = await getActingUserId();

  // Not logged in - show login instructions
  if (!actingUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <main className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <PawsIcon size={64} color="teal" />
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              dogcal
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Coordinate care time for your pups with friends
            </p>
          </div>

          {/* Login instructions */}
          <div className="w-full max-w-md space-y-6 pt-4 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Please use your login link
            </h2>
            <p className="text-gray-600">
              To access your account, please use the personalized login link sent to you.
            </p>
            <p className="text-sm text-gray-500">
              Don't have a login link? Contact Edi.
            </p>
          </div>

          {/* Footer decoration */}
          <div className="pt-8 text-sm text-gray-500">
            Manage hangouts, schedule care, and stay connected
          </div>
        </main>
      </div>
    );
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
      // Also get total count for pagination
      prisma.hangout.count({
        where: {
          pupId: { in: pupIds },
          endAt: { gte: now },
          status: { in: ['OPEN', 'ASSIGNED'] },
        },
      }),
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
        },
      }),
      prisma.hangout.findMany({
        where: {
          assignedFriendUserId: actingUserId,
          endAt: { gte: now },
          status: 'ASSIGNED',
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
