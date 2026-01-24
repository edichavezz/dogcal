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
    include: {
      ownedPups: true,
      pupFriendships: {
        include: {
          pup: true,
        },
      },
    },
  });

  if (!actingUser) {
    redirect('/');
  }

  // Get upcoming hangouts based on role
  const now = new Date();
  let upcomingHangouts;

  if (actingUser.role === 'OWNER') {
    // Owners see all hangouts for their pups
    upcomingHangouts = await prisma.hangout.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pupId: { in: actingUser.ownedPups.map((p: any) => p.id) },
        endAt: { gte: now },
      },
      include: {
        pup: {
          include: {
            owner: true,
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
      },
      orderBy: { startAt: 'asc' },
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
      include: {
        pup: {
          include: {
            owner: true,
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
      },
      orderBy: { startAt: 'asc' },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav user={actingUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Calendar
          </h1>
          <p className="text-gray-600">
            {actingUser.role === 'OWNER'
              ? 'View and manage hangouts for your pups'
              : 'View available hangouts and your upcoming commitments'}
          </p>
        </div>

        <CalendarClient
          hangouts={upcomingHangouts}
          actingUserId={actingUserId}
          actingUserRole={actingUser.role}
        />
      </main>
    </div>
  );
}
