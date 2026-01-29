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

  const actingUser = await prisma.user.findUnique({
    where: { id: actingUserId },
    include: {
      ownedPups: true,
    },
  });

  if (!actingUser) {
    redirect('/');
  }

  if (actingUser.role !== 'OWNER') {
    redirect('/calendar');
  }

  // Get pending suggestions for owner's pups
  const pendingSuggestions = await prisma.hangoutSuggestion.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pupId: { in: actingUser.ownedPups.map((p: any) => p.id) },
      status: 'PENDING',
    },
    include: {
      pup: true,
      suggestedByFriend: true,
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
            Pending Suggestions
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
