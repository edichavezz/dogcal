import { getActingUserId } from './lib/cookies';
import { prisma } from './lib/prisma';
import WelcomeScreen from './components/WelcomeScreen';

export default async function Home() {
  const actingUserId = await getActingUserId();

  // Not logged in - show login instructions
  if (!actingUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <main className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#f4a9a8"/>
              <ellipse cx="11" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <ellipse cx="21" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <path d="M 10 20 Q 16 24 22 20" stroke="#1a3a3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="9" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="23" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="6" cy="11" r="2" fill="#f4a9a8"/>
              <circle cx="26" cy="11" r="2" fill="#f4a9a8"/>
            </svg>
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
              Don't have a login link? Contact your administrator.
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
