import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import TopNav from '@/components/TopNav';
import CreateHangoutForm from '@/components/CreateHangoutForm';

export default async function NewHangoutPage() {
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

  // Get all friends who have friendships with this owner's pups
  const friendships = await prisma.pupFriendship.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pupId: { in: actingUser.ownedPups.map((p: any) => p.id) },
    },
    include: {
      friend: true,
    },
  });

  // Get unique friends
  const friendsMap = new Map();
  friendships.forEach((f) => {
    if (!friendsMap.has(f.friend.id)) {
      friendsMap.set(f.friend.id, {
        id: f.friend.id,
        name: f.friend.name,
      });
    }
  });
  const friends = Array.from(friendsMap.values());

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav user={actingUser} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create New Hangout
            </h1>
            <p className="text-gray-600">
              Schedule a time for one of your pups to hang out with a friend
            </p>
          </div>

          <CreateHangoutForm pups={actingUser.ownedPups} friends={friends} />
        </div>
      </main>
    </div>
  );
}
