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
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav user={actingUser} />

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Calendar
            </h1>
            <p className="text-sm text-slate-600">
              {actingUser.role === 'OWNER'
                ? 'View and manage hangouts for your pups'
                : 'View available hangouts and your upcoming commitments'}
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <CalendarClient
              hangouts={upcomingHangouts}
              actingUserId={actingUserId}
              actingUserRole={actingUser.role}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
