import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import TopNav from '@/components/TopNav';
import SuggestHangoutForm from '@/components/SuggestHangoutForm';

export default async function SuggestPage() {
  const actingUserId = await getActingUserId();

  if (!actingUserId) {
    redirect('/');
  }

  const actingUser = await prisma.user.findUnique({
    where: { id: actingUserId },
    include: {
      pupFriendships: {
        include: {
          pup: {
            include: {
              owner: true,
            },
          },
        },
      },
    },
  });

  if (!actingUser) {
    redirect('/');
  }

  if (actingUser.role !== 'FRIEND') {
    redirect('/calendar');
  }

  // Get pups this friend can suggest times for
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pups = actingUser.pupFriendships.map((f: any) => f.pup);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav user={actingUser} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Suggest a Hangout Time
            </h1>
            <p className="text-gray-600">
              Propose a time when you&apos;re available to hang out with a pup
            </p>
          </div>

          <SuggestHangoutForm pups={pups} />
        </div>
      </main>
    </div>
  );
}
