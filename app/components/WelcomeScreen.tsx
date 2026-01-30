'use client';

/**
 * Welcome Screen Component
 *
 * Action-focused home page with different layouts for owners and friends.
 * Features rotating fun messages, clickable hangout cards, and pup action cards.
 */

import { useState, useCallback } from 'react';
import { User, Pup, PupFriendship } from '@prisma/client';
import AppLayout from './AppLayout';
import Avatar from './Avatar';
import EventDetailsModal from './EventDetailsModal';
import { useFunMessage } from './home/FunMessage';
import HangoutListCard, { HangoutCardData } from './home/HangoutListCard';
import SuggestionPreviewCard, { SuggestionCardData } from './home/SuggestionPreviewCard';
import PupActionCard, { PupCardData } from './home/PupActionCard';

// Hangout type with notes for modal
type HangoutWithNotes = HangoutCardData & {
  ownerNotes?: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    careInstructions?: string | null;
    owner: {
      id: string;
      name: string;
    };
  };
  notes: Array<{
    id: string;
    noteText: string;
    createdAt: string;
    author: {
      name: string;
    };
  }>;
};

interface WelcomeScreenProps {
  user: User & {
    ownedPups: Pick<Pup, 'id' | 'name' | 'profilePhotoUrl'>[];
    pupFriendships: (PupFriendship & {
      pup: Pick<Pup, 'id' | 'name' | 'profilePhotoUrl' | 'ownerUserId'> & {
        owner: Pick<User, 'id' | 'name'>;
      };
    })[];
  };
  // For owners
  upcomingHangouts: HangoutWithNotes[];
  pendingSuggestions: SuggestionCardData[];
  // For friends
  availableHangouts: HangoutWithNotes[];
  myHangoutsAndSuggestions: {
    hangouts: HangoutWithNotes[];
    suggestions: SuggestionCardData[];
  } | [];
}

export default function WelcomeScreen({
  user,
  upcomingHangouts,
  pendingSuggestions,
  availableHangouts,
  myHangoutsAndSuggestions,
}: WelcomeScreenProps) {
  const isOwner = user.role === 'OWNER';
  const pups: PupCardData[] = isOwner
    ? user.ownedPups
    : user.pupFriendships.map(friendship => ({
        ...friendship.pup,
        owner: friendship.pup.owner,
      }));

  const pupNames = pups.map(p => p.name);
  const funMessage = useFunMessage(isOwner ? 'OWNER' : 'FRIEND', pupNames);

  // Modal state
  const [selectedHangout, setSelectedHangout] = useState<HangoutWithNotes | null>(null);

  const handleHangoutClick = useCallback((hangout: HangoutWithNotes) => {
    setSelectedHangout(hangout);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedHangout(null);
  }, []);

  const handleModalUpdate = useCallback(() => {
    // Refresh the page to get updated data
    window.location.reload();
  }, []);

  // Get friend hangouts and suggestions
  const friendHangouts = Array.isArray(myHangoutsAndSuggestions) ? [] : myHangoutsAndSuggestions.hangouts;
  const friendSuggestions = Array.isArray(myHangoutsAndSuggestions) ? [] : myHangoutsAndSuggestions.suggestions;

  return (
    <AppLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with small avatar and fun message */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Avatar
            photoUrl={user.profilePhotoUrl}
            name={user.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">Welcome back, {user.name}!</p>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">
              {funMessage || "Ready for today's adventures?"}
            </h1>
          </div>
        </div>

        {/* Owner Layout */}
        {isOwner && (
          <div className="space-y-6 sm:space-y-8">
            {/* Pending Suggestions */}
            {pendingSuggestions.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Pending suggestions
                </h2>
                <div className="space-y-3">
                  {pendingSuggestions.map(suggestion => (
                    <SuggestionPreviewCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      showFriend={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Hangouts */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Upcoming hangouts
              </h2>
              {upcomingHangouts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHangouts.map(hangout => (
                    <HangoutListCard
                      key={hangout.id}
                      hangout={hangout}
                      onClick={() => handleHangoutClick(hangout)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                  <p className="text-gray-600">No upcoming hangouts scheduled.</p>
                  <p className="text-sm text-gray-500 mt-1">Create a hangout for one of your pups below!</p>
                </div>
              )}
            </section>

            {/* Your Pups */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Your pups
              </h2>
              {pups.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {pups.map(pup => (
                    <PupActionCard
                      key={pup.id}
                      pup={pup}
                      isOwner={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                  <p className="text-gray-600">You haven't added any pups yet.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Friend Layout */}
        {!isOwner && (
          <div className="space-y-6 sm:space-y-8">
            {/* Available Hangouts (OPEN) */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Looking for a pup hangout? Available slots:
              </h2>
              {availableHangouts.length > 0 ? (
                <div className="space-y-3">
                  {availableHangouts.map(hangout => (
                    <HangoutListCard
                      key={hangout.id}
                      hangout={hangout}
                      onClick={() => handleHangoutClick(hangout)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                  <p className="text-gray-600">No available hangouts at the moment.</p>
                  <p className="text-sm text-gray-500 mt-1">Suggest a time for one of the pups below!</p>
                </div>
              )}
            </section>

            {/* Your Hangouts & Suggestions */}
            {(friendHangouts.length > 0 || friendSuggestions.length > 0) && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Your upcoming hangouts and suggestions
                </h2>
                <div className="space-y-3">
                  {friendHangouts.map(hangout => (
                    <HangoutListCard
                      key={hangout.id}
                      hangout={hangout}
                      onClick={() => handleHangoutClick(hangout)}
                    />
                  ))}
                  {friendSuggestions.map(suggestion => (
                    <SuggestionPreviewCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      showFriend={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pups You Care For */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Pups you care for
              </h2>
              {pups.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {pups.map(pup => (
                    <PupActionCard
                      key={pup.id}
                      pup={pup}
                      isOwner={false}
                      ownerName={pup.owner?.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                  <p className="text-gray-600">You're not assigned to care for any pups yet.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedHangout && (
        <EventDetailsModal
          hangout={selectedHangout}
          actingUserId={user.id}
          actingUserRole={isOwner ? 'OWNER' : 'FRIEND'}
          onClose={handleModalClose}
          onUpdate={handleModalUpdate}
        />
      )}
    </AppLayout>
  );
}
