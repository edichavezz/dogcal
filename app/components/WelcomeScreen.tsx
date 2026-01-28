/**
 * Welcome Screen Component
 *
 * Personalized home page showing user info, their pups, and quick actions.
 */

import { User, Pup, PupFriendship } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';

interface WelcomeScreenProps {
  user: User & {
    ownedPups: Pup[];
    pupFriendships: (PupFriendship & {
      pup: Pup & {
        owner: User;
      };
    })[];
  };
}

export default function WelcomeScreen({ user }: WelcomeScreenProps) {
  const isOwner = user.role === 'OWNER';
  const pups = isOwner
    ? user.ownedPups
    : user.pupFriendships.map(friendship => friendship.pup);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">🐾</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              DogCal
            </h1>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-slate-600 text-lg">
            {isOwner
              ? "Manage your pups' hangouts and care schedules"
              : 'View and manage the pups you care for'}
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-slate-200">
              {user.profilePhotoUrl ? (
                <Image
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-slate-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
                {user.name}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm border ${
                    isOwner
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isOwner ? '🏠 Owner' : '🤝 Friend'}
                </span>
                {user.phoneNumber && (
                  <span className="text-slate-600 text-sm">
                    📱 {user.phoneNumber}
                  </span>
                )}
              </div>
              {user.address && (
                <p className="text-slate-600 text-sm mt-2">
                  📍 {user.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pups Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {isOwner ? '🐕 Your Pups' : '🐾 Pups You Care For'}
          </h3>

          {pups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-500">
                {isOwner
                  ? 'You haven\'t added any pups yet.'
                  : 'You\'re not assigned to care for any pups yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {pups.map(pup => {
                // For friends, get owner info from the pup
                const pupOwner = isOwner ? user : (pup as any).owner;

                return (
                  <div
                    key={pup.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-amber-50 to-orange-50">
                      {pup.profilePhotoUrl ? (
                        <Image
                          src={pup.profilePhotoUrl}
                          alt={pup.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-6xl">
                          🐕
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h4 className="text-lg font-semibold text-slate-900 mb-1">
                        {pup.name}
                      </h4>

                      {pup.breed && (
                        <p className="text-slate-600 text-sm mb-2">
                          {pup.breed}
                        </p>
                      )}

                      {!isOwner && pupOwner && (
                        <p className="text-slate-500 text-sm mb-2">
                          Owner: {pupOwner.name}
                        </p>
                      )}

                      {pup.careInstructions && (
                        <p className="text-slate-600 text-sm mt-3 pt-3 border-t border-slate-200 line-clamp-3">
                          {pup.careInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            ⚡ Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* View Calendar - Available to all */}
            <ActionButton
              href="/calendar"
              icon="📅"
              title="View Calendar"
              description="See all scheduled hangouts"
            />

            {/* Owner-specific actions */}
            {isOwner && (
              <>
                <ActionButton
                  href="/hangouts/new"
                  icon="➕"
                  title="Create Hangout"
                  description="Schedule a new hangout"
                />

                <ActionButton
                  href="/approvals"
                  icon="✅"
                  title="Review Suggestions"
                  description="Approve or reject time suggestions"
                />

                <ActionButton
                  href="/manage"
                  icon="⚙️"
                  title="Manage Pups & Friends"
                  description="Edit pups and friendships"
                />
              </>
            )}

            {/* Friend-specific actions */}
            {!isOwner && (
              <ActionButton
                href="/suggest"
                icon="💡"
                title="Suggest Time"
                description="Propose a hangout time"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function ActionButton({ href, icon, title, description }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="block p-4 border-2 border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl sm:text-3xl flex-shrink-0">{icon}</div>
        <div>
          <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
