import { getActingUserId } from './lib/cookies';
import { prisma } from './lib/prisma';
import WelcomeScreen from './components/WelcomeScreen';

export default async function Home() {
  const actingUserId = await getActingUserId();

  // Not logged in - show login instructions
  if (!actingUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <main className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl">
          {/* Paw icon decoration */}
          <div className="text-6xl sm:text-7xl">🐾</div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              DogCal
            </h1>
            <p className="text-lg sm:text-xl text-slate-600">
              Coordinate care time for your pups with friends
            </p>
          </div>

          {/* Login instructions */}
          <div className="w-full max-w-md space-y-6 pt-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Please use your login link
            </h2>
            <p className="text-slate-600">
              To access your account, please use the personalized login link sent to you.
            </p>
            <p className="text-sm text-slate-500">
              Don't have a login link? Contact your administrator.
            </p>
          </div>

          {/* Footer decoration */}
          <div className="pt-8 text-sm text-slate-500">
            Manage hangouts, schedule care, and stay connected
          </div>
        </main>
      </div>
    );
  }

  // Fetch user with their pups and friendships
  const user = await prisma.user.findUnique({
    where: { id: actingUserId },
    include: {
      ownedPups: true,
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

  if (!user) {
    // User not found - this shouldn't happen, but handle gracefully
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return <WelcomeScreen user={user} />;
}
