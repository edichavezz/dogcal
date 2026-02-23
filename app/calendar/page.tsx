import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/AppLayout';
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
      profilePhotoUrl: true,
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

  // Shared hangout select shape
  const hangoutSelect = {
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
        owner: { select: { id: true, name: true } },
      },
    },
    assignedFriend: {
      select: {
        id: true,
        name: true,
        profilePhotoUrl: true,
      },
    },
  } as const;

  const suggestionSelect = {
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
      },
    },
    suggestedByFriend: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const;

  // Build queries based on role - use parallel fetching with Promise.all
  if (actingUser.role === 'OWNER') {
    const ownedPupIds = actingUser.ownedPups.map((p) => p.id);
    const friendPupIds = actingUser.pupFriendships.map((f) => f.pupId);

    const [ownedHangouts, ownedSuggestions, friendHangouts, mySuggestions] = await Promise.all([
      // Hangouts for owned pups
      prisma.hangout.findMany({
        where: { pupId: { in: ownedPupIds }, endAt: { gte: now } },
        select: hangoutSelect,
        orderBy: { startAt: 'asc' },
        take: 100,
      }),
      // Suggestions for owned pups (from friends)
      prisma.hangoutSuggestion.findMany({
        where: { pupId: { in: ownedPupIds }, status: 'PENDING', endAt: { gte: now } },
        select: suggestionSelect,
        orderBy: { startAt: 'asc' },
        take: 50,
      }),
      // Hangouts for friend pups (OPEN ones + ones assigned to this user)
      friendPupIds.length > 0
        ? prisma.hangout.findMany({
            where: {
              pupId: { in: friendPupIds },
              endAt: { gte: now },
              OR: [{ status: 'OPEN' }, { assignedFriendUserId: actingUserId }],
            },
            select: hangoutSelect,
            orderBy: { startAt: 'asc' },
            take: 100,
          })
        : Promise.resolve([]),
      // Suggestions submitted by this owner for friend pups
      friendPupIds.length > 0
        ? prisma.hangoutSuggestion.findMany({
            where: { suggestedByFriendUserId: actingUserId, status: 'PENDING', endAt: { gte: now } },
            select: suggestionSelect,
            orderBy: { startAt: 'asc' },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    // Merge and dedup hangouts by ID
    const hangoutMap = new Map<string, typeof ownedHangouts[0]>();
    [...ownedHangouts, ...friendHangouts].forEach((h) => hangoutMap.set(h.id, h));
    const allHangouts = Array.from(hangoutMap.values());

    const allSuggestions = [...ownedSuggestions, ...mySuggestions];

    const hangoutsWithEmptyNotes = allHangouts.map((h) => ({ ...h, notes: [] }));

    const ownedPups = actingUser.ownedPups;
    const friendPups = actingUser.pupFriendships.map((f) => f.pup);

    return (
      <AppLayout user={actingUser}>
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Calendar
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage hangouts for your pups
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <CalendarClient
              hangouts={hangoutsWithEmptyNotes}
              suggestions={allSuggestions}
              actingUserId={actingUserId}
              actingUserRole={actingUser.role}
              ownedPups={ownedPups}
              friendPups={friendPups}
            />
          </div>
        </div>
      </AppLayout>
    );
  } else {
    // FRIEND role
    const friendPupIds = actingUser.pupFriendships.map((f) => f.pupId);

    const [upcomingHangouts, upcomingSuggestions] = await Promise.all([
      prisma.hangout.findMany({
        where: {
          AND: [
            { endAt: { gte: now } },
            {
              OR: [
                { AND: [{ pupId: { in: friendPupIds } }, { status: 'OPEN' }] },
                { assignedFriendUserId: actingUserId },
              ],
            },
          ],
        },
        select: hangoutSelect,
        orderBy: { startAt: 'asc' },
        take: 100,
      }),
      prisma.hangoutSuggestion.findMany({
        where: { suggestedByFriendUserId: actingUserId, status: 'PENDING', endAt: { gte: now } },
        select: suggestionSelect,
        orderBy: { startAt: 'asc' },
        take: 50,
      }),
    ]);

    const hangoutsWithEmptyNotes = upcomingHangouts.map((h) => ({ ...h, notes: [] }));
    const friendPups = actingUser.pupFriendships.map((f) => f.pup);

    return (
      <AppLayout user={actingUser}>
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Calendar
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View available hangouts and your upcoming commitments
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <CalendarClient
              hangouts={hangoutsWithEmptyNotes}
              suggestions={upcomingSuggestions}
              actingUserId={actingUserId}
              actingUserRole={actingUser.role}
              ownedPups={[]}
              friendPups={friendPups}
            />
          </div>
        </div>
      </AppLayout>
    );
  }
}
