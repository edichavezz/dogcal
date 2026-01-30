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

  // Fetch user with their pups and friendships - limit to what's displayed on welcome screen
  const user = await prisma.user.findUnique({
    where: { id: actingUserId },
    include: {
      ownedPups: {
        take: 5,
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
        },
      },
      pupFriendships: {
        take: 5,
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

  return <WelcomeScreen user={user} />;
}
