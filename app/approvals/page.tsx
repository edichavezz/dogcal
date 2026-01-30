import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/AppLayout';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const actingUserId = await getActingUserId();

  if (!actingUserId) {
    redirect('/');
  }

  // Optimized query with select to only fetch needed fields
  const actingUser = await prisma.user.findUnique({
    where: { id: actingUserId },
    select: {
      id: true,
      name: true,
      role: true,
      addressText: true,
      phoneNumber: true,
      profilePhotoUrl: true,
      ownedPups: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!actingUser) {
    redirect('/');
  }

  if (actingUser.role !== 'OWNER') {
    redirect('/calendar');
  }

  // Get pending suggestions for owner's pups with optimized select
  const pendingSuggestions = await prisma.hangoutSuggestion.findMany({
    where: {
      pupId: { in: actingUser.ownedPups.map((p) => p.id) },
      status: 'PENDING',
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      friendComment: true,
      eventName: true,
      createdAt: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <AppLayout user={actingUser}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Pending suggestions
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and approve or reject hangout times suggested by your friends
          </p>
        </div>

        <ApprovalsClient suggestions={pendingSuggestions} />
      </div>
    </AppLayout>
  );
}
