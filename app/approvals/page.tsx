import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import TopNav from '@/components/TopNav';
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
    <div className="min-h-screen bg-gray-50">
      <TopNav user={actingUser} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pending Suggestions
          </h1>
          <p className="text-gray-600">
            Review and approve or reject hangout times suggested by your friends
          </p>
        </div>

        <ApprovalsClient suggestions={pendingSuggestions} />
      </main>
    </div>
  );
}
