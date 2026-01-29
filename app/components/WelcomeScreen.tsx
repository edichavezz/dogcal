/**
 * Welcome Screen Component
 *
 * Personalized home page showing user info, their pups, and quick actions.
 * Uses new dark teal/coral design system.
 */

import { User, Pup, PupFriendship } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Plus, CheckSquare, Users, Lightbulb } from 'lucide-react';
import AppLayout from './AppLayout';
import Avatar from './Avatar';

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
    <AppLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isOwner
              ? "Manage your pups' hangouts and care schedules"
              : 'View and manage the pups you care for'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1 bg-[#1a3a3a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <Avatar
                photoUrl={user.profilePhotoUrl}
                name={user.name}
                size="xl"
                className="mb-3 sm:mb-4"
              />
              <h2 className="text-base sm:text-lg font-semibold mb-1">{user.name}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a4a4a] text-xs sm:text-sm mb-3 sm:mb-4">
                <div className="w-2 h-2 rounded-full bg-[#f4a9a8]"></div>
                {isOwner ? 'Owner' : 'Friend'}
              </div>
              {user.phoneNumber && (
                <p className="text-gray-300 text-xs sm:text-sm mb-1">{user.phoneNumber}</p>
              )}
              {user.address && (
                <p className="text-gray-400 text-xs sm:text-sm">{user.address}</p>
              )}
            </div>
          </div>

          {/* Your Pups Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#f4a9a8]/20">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {isOwner ? 'Your Pups' : 'Pups You Care For'}
            </h2>

            {pups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/40 text-center">
                <p className="text-gray-600">
                  {isOwner
                    ? 'You haven\'t added any pups yet.'
                    : 'You\'re not assigned to care for any pups yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pups.slice(0, 3).map(pup => {
                  const pupOwner = isOwner ? user : (pup as any).owner;
                  return (
                    <div
                      key={pup.id}
                      className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/40"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0">
                          {pup.profilePhotoUrl ? (
                            <Image
                              src={pup.profilePhotoUrl}
                              alt={pup.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">
                              🐕
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">{pup.name}</h3>
                          {pup.breed && (
                            <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">{pup.breed}</p>
                          )}
                          {!isOwner && pupOwner && (
                            <p className="text-xs sm:text-sm text-gray-600">Owner: {pupOwner.name}</p>
                          )}
                          {pup.careInstructions && (
                            <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-2">
                              {pup.careInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {pups.length > 3 && (
                  <Link
                    href="/manage"
                    className="block text-center text-sm text-[#1a3a3a] font-medium hover:underline"
                  >
                    View all {pups.length} pups
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <ActionButton
              href="/calendar"
              icon={Calendar}
              title="View Calendar"
              description="See all scheduled hangouts"
            />

            {isOwner ? (
              <>
                <ActionButton
                  href="/hangouts/new"
                  icon={Plus}
                  title="Create Hangout"
                  description="Schedule a time for your pup"
                />
                <ActionButton
                  href="/approvals"
                  icon={CheckSquare}
                  title="Review Suggestions"
                  description="Approve or reject suggestions"
                />
                <ActionButton
                  href="/manage"
                  icon={Users}
                  title="Pups & Friends"
                  description="Edit pups and friendships"
                />
              </>
            ) : (
              <>
                <ActionButton
                  href="/suggest"
                  icon={Lightbulb}
                  title="Suggest Time"
                  description="Propose a hangout time"
                />
                <ActionButton
                  href="/manage"
                  icon={Users}
                  title="Pups"
                  description="View pups you care for"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function ActionButton({ href, icon: Icon, title, description }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all text-left group border border-gray-200"
    >
      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
        <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{description}</p>
    </Link>
  );
}
