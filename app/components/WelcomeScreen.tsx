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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            {isOwner
              ? "Manage your pups' hangouts and care schedules"
              : 'View and manage the pups you care for'}
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {user.profilePhotoUrl ? (
                <Image
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {user.name}
              </h2>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isOwner
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role}
                </span>
                {user.phoneNumber && (
                  <span className="text-gray-600 text-sm">
                    {user.phoneNumber}
                  </span>
                )}
              </div>
              {user.address && (
                <p className="text-gray-600 text-sm mt-2">{user.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pups Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwner ? 'Your Pups' : 'Pups You Care For'}
          </h2>

          {pups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                {isOwner
                  ? 'You haven\'t added any pups yet.'
                  : 'You\'re not assigned to care for any pups yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pups.map(pup => {
                // For friends, get owner info from the pup
                const pupOwner = isOwner ? user : (pup as any).owner;

                return (
                  <div
                    key={pup.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-200">
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
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {pup.name}
                      </h3>

                      {pup.breed && (
                        <p className="text-gray-600 text-sm mb-2">
                          {pup.breed}
                        </p>
                      )}

                      {!isOwner && pupOwner && (
                        <p className="text-gray-500 text-sm mb-2">
                          Owner: {pupOwner.name}
                        </p>
                      )}

                      {pup.careInstructions && (
                        <p className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-200 line-clamp-3">
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      className="block p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
