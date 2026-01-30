import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/AppLayout';
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
    <AppLayout user={actingUser}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Suggest a hangout time
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Propose a time when you&apos;re available to hang out with a pup
            </p>
          </div>

          <SuggestHangoutForm pups={pups} />
        </div>
      </div>
    </AppLayout>
  );
}
