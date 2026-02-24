'use client';

/**
 * Welcome Screen Component
 *
 * Action-focused home page with different layouts for owners and friends.
 * Features rotating fun messages, clickable hangout cards, pup action cards,
 * filters (time range, status, hide repeats), and pagination.
 */

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AppLayout from './AppLayout';
import Avatar from './Avatar';
import { useFunMessage } from './home/FunMessage';
import HangoutListCard, { HangoutCardData } from './home/HangoutListCard';
import SuggestionPreviewCard, { SuggestionCardData } from './home/SuggestionPreviewCard';
import PupActionCard, { PupCardData } from './home/PupActionCard';
import HangoutFilters, { HangoutFiltersState } from './home/HangoutFilters';
import PawsLoader from './ui/PawsLoader';

const EventDetailsModal = dynamic(() => import('./EventDetailsModal'), {
  ssr: false,
});

type WelcomeUser = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  profilePhotoUrl?: string | null;
  ownedPups: Array<{
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    friends?: Array<{ id: string; name: string; profilePhotoUrl: string | null }>;
  }>;
  pupFriendships: Array<{
    id: string;
    pupId: string;
    pup: {
      id: string;
      name: string;
      profilePhotoUrl?: string | null;
      ownerUserId: string;
      owner: {
        id: string;
        name: string;
      };
    };
  }>;
};

type HangoutSummary = HangoutCardData;

type HangoutModalData = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  ownerNotes?: string | null;
  eventName: string | null;
  seriesId?: string | null;
  seriesIndex?: number | null;
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
  assignedFriend?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  } | null;
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
  user: WelcomeUser;
  // For owners
  upcomingHangouts: HangoutSummary[];
  upcomingHangoutsTotal: number;
  pendingSuggestions: SuggestionCardData[];
  // For friends
  availableHangouts: HangoutSummary[];
  availableHangoutsTotal: number;
  myHangoutsAndSuggestions: {
    hangouts: HangoutSummary[];
    suggestions: SuggestionCardData[];
  } | [];
  myHangoutsTotal: number;
  // For owners who are also friends for other pups
  friendPups?: PupCardData[];
  // Suggestions the owner submitted for friend pups (awaiting their approval)
  mySubmittedSuggestions?: SuggestionCardData[];
}

const ITEMS_PER_PAGE = 5;

export default function WelcomeScreen({
  user,
  upcomingHangouts: initialUpcomingHangouts,
  upcomingHangoutsTotal: initialUpcomingTotal,
  pendingSuggestions,
  availableHangouts: initialAvailableHangouts,
  availableHangoutsTotal: initialAvailableTotal,
  myHangoutsAndSuggestions,
  myHangoutsTotal: initialMyTotal,
  friendPups = [],
  mySubmittedSuggestions = [],
}: WelcomeScreenProps) {
  const router = useRouter();
  const isOwner = user.role === 'OWNER';

  // Memoize pups to prevent recreation on every render
  const pups: PupCardData[] = useMemo(() =>
    isOwner
      ? user.ownedPups
      : user.pupFriendships.map(friendship => ({
          ...friendship.pup,
          owner: friendship.pup.owner,
        })),
    [isOwner, user.ownedPups, user.pupFriendships]
  );

  // Memoize pupNames to prevent fun message from changing on filter updates
  const pupNames = useMemo(() => pups.map(p => p.name), [pups]);
  const funMessage = useFunMessage(isOwner ? 'OWNER' : 'FRIEND', pupNames);

  // Modal state
  const [selectedHangout, setSelectedHangout] = useState<HangoutModalData | null>(null);
  const [isHangoutDetailsLoading, setIsHangoutDetailsLoading] = useState(false);

  // Filter state for owners
  const [ownerFilters, setOwnerFilters] = useState<HangoutFiltersState>({
    timeRange: 'all',
    status: 'all',
    hideRepeats: true, // Hide recurring hangouts by default
  });

  // Filter state for friends (available hangouts)
  const [friendAvailableFilters, setFriendAvailableFilters] = useState<HangoutFiltersState>({
    timeRange: 'all',
    status: 'all', // Not used for available
    hideRepeats: true, // Hide recurring hangouts by default
  });

  // Filter state for friends (my hangouts)
  const [friendMyFilters, setFriendMyFilters] = useState<HangoutFiltersState>({
    timeRange: 'all',
    status: 'all', // Not used for my hangouts
    hideRepeats: true, // Hide recurring hangouts by default
  });

  // Hangout lists with loading states
  const [upcomingHangouts, setUpcomingHangouts] = useState(initialUpcomingHangouts);
  const [upcomingTotal, setUpcomingTotal] = useState(initialUpcomingTotal);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  const [availableHangouts, setAvailableHangouts] = useState(initialAvailableHangouts);
  const [availableTotal, setAvailableTotal] = useState(initialAvailableTotal);
  const [availableLoading, setAvailableLoading] = useState(false);

  const [myHangouts, setMyHangouts] = useState(
    Array.isArray(myHangoutsAndSuggestions) ? [] : myHangoutsAndSuggestions.hangouts
  );
  const [myTotal, setMyTotal] = useState(initialMyTotal);
  const [myLoading, setMyLoading] = useState(false);

  const friendSuggestions = Array.isArray(myHangoutsAndSuggestions) ? [] : myHangoutsAndSuggestions.suggestions;

  const handleHangoutClick = useCallback(async (hangout: HangoutSummary) => {
    setIsHangoutDetailsLoading(true);
    try {
      const response = await fetch(`/api/hangouts/${hangout.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hangout details');
      }
      const data = await response.json();
      setSelectedHangout(data.hangout as HangoutModalData);
    } catch (error) {
      console.error('Error loading hangout details:', error);
    } finally {
      setIsHangoutDetailsLoading(false);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedHangout(null);
  }, []);

  // Fetch hangouts with filters
  const fetchHangouts = useCallback(async (
    context: 'owner' | 'friend-available' | 'friend-assigned',
    filters: HangoutFiltersState,
    offset: number = 0
  ) => {
    const params = new URLSearchParams({
      context,
      timeRange: filters.timeRange,
      status: filters.status,
      hideRepeats: String(filters.hideRepeats),
      limit: String(ITEMS_PER_PAGE),
      offset: String(offset),
    });

    const response = await fetch(`/api/hangouts/list?${params}`);
    if (!response.ok) throw new Error('Failed to fetch hangouts');

    const data = await response.json();
    return { hangouts: data.hangouts as HangoutSummary[], total: data.total as number };
  }, []);

  const handleModalUpdate = useCallback(async () => {
    setSelectedHangout(null);

    try {
      if (isOwner) {
        const { hangouts, total } = await fetchHangouts('owner', ownerFilters);
        setUpcomingHangouts(hangouts);
        setUpcomingTotal(total);
      } else {
        const [available, myAssigned] = await Promise.all([
          fetchHangouts('friend-available', friendAvailableFilters),
          fetchHangouts('friend-assigned', friendMyFilters),
        ]);
        setAvailableHangouts(available.hangouts);
        setAvailableTotal(available.total);
        setMyHangouts(myAssigned.hangouts);
        setMyTotal(myAssigned.total);
      }
    } catch (error) {
      console.error('Error refreshing hangouts:', error);
    }

    router.refresh();
  }, [
    isOwner,
    fetchHangouts,
    ownerFilters,
    friendAvailableFilters,
    friendMyFilters,
    router,
  ]);

  // Handle filter change for owners
  const handleOwnerFilterChange = useCallback(async (newFilters: HangoutFiltersState) => {
    setOwnerFilters(newFilters);
    setUpcomingLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('owner', newFilters);
      setUpcomingHangouts(hangouts);
      setUpcomingTotal(total);
    } catch (error) {
      console.error('Error fetching hangouts:', error);
    } finally {
      setUpcomingLoading(false);
    }
  }, [fetchHangouts]);

  // Handle filter change for friend available
  const handleFriendAvailableFilterChange = useCallback(async (newFilters: HangoutFiltersState) => {
    setFriendAvailableFilters(newFilters);
    setAvailableLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('friend-available', newFilters);
      setAvailableHangouts(hangouts);
      setAvailableTotal(total);
    } catch (error) {
      console.error('Error fetching hangouts:', error);
    } finally {
      setAvailableLoading(false);
    }
  }, [fetchHangouts]);

  // Handle filter change for friend my hangouts
  const handleFriendMyFilterChange = useCallback(async (newFilters: HangoutFiltersState) => {
    setFriendMyFilters(newFilters);
    setMyLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('friend-assigned', newFilters);
      setMyHangouts(hangouts);
      setMyTotal(total);
    } catch (error) {
      console.error('Error fetching hangouts:', error);
    } finally {
      setMyLoading(false);
    }
  }, [fetchHangouts]);

  // Load more handlers
  const handleLoadMoreUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('owner', ownerFilters, upcomingHangouts.length);
      setUpcomingHangouts(prev => [...prev, ...hangouts]);
      setUpcomingTotal(total);
    } catch (error) {
      console.error('Error loading more hangouts:', error);
    } finally {
      setUpcomingLoading(false);
    }
  }, [fetchHangouts, ownerFilters, upcomingHangouts.length]);

  const handleLoadMoreAvailable = useCallback(async () => {
    setAvailableLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('friend-available', friendAvailableFilters, availableHangouts.length);
      setAvailableHangouts(prev => [...prev, ...hangouts]);
      setAvailableTotal(total);
    } catch (error) {
      console.error('Error loading more hangouts:', error);
    } finally {
      setAvailableLoading(false);
    }
  }, [fetchHangouts, friendAvailableFilters, availableHangouts.length]);

  const handleLoadMoreMy = useCallback(async () => {
    setMyLoading(true);
    try {
      const { hangouts, total } = await fetchHangouts('friend-assigned', friendMyFilters, myHangouts.length);
      setMyHangouts(prev => [...prev, ...hangouts]);
      setMyTotal(total);
    } catch (error) {
      console.error('Error loading more hangouts:', error);
    } finally {
      setMyLoading(false);
    }
  }, [fetchHangouts, friendMyFilters, myHangouts.length]);

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

            {/* Suggestions this owner submitted for friend pups */}
            {mySubmittedSuggestions.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Suggestions you submitted
                </h2>
                <div className="space-y-3">
                  {mySubmittedSuggestions.map(suggestion => (
                    <SuggestionPreviewCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      showFriend={false}
                      interactive={false}
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
              <HangoutFilters
                filters={ownerFilters}
                onChange={handleOwnerFilterChange}
                showStatusFilter={true}
              />
              {upcomingLoading && upcomingHangouts.length === 0 ? (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 flex justify-center">
                  <PawsLoader size="sm" />
                </div>
              ) : upcomingHangouts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHangouts.map(hangout => (
                    <HangoutListCard
                      key={hangout.id}
                      hangout={hangout}
                      onClick={() => handleHangoutClick(hangout)}
                    />
                  ))}
                  {upcomingHangouts.length < upcomingTotal && (
                    <button
                      onClick={handleLoadMoreUpcoming}
                      disabled={upcomingLoading}
                      className="w-full py-2 text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
                    >
                      {upcomingLoading ? 'Loading...' : `Show more (${upcomingTotal - upcomingHangouts.length} remaining)`}
                    </button>
                  )}
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
                  <p className="text-gray-600">You haven&apos;t added any pups yet.</p>
                </div>
              )}
            </section>

            {/* Pups you're also a friend for */}
            {friendPups.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Pups you&apos;re also a friend for
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {friendPups.map(pup => (
                    <PupActionCard
                      key={pup.id}
                      pup={pup}
                      isOwner={false}
                      ownerName={pup.owner?.name}
                    />
                  ))}
                </div>
              </section>
            )}
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
              <HangoutFilters
                filters={friendAvailableFilters}
                onChange={handleFriendAvailableFilterChange}
                showStatusFilter={false}
              />
              {availableLoading && availableHangouts.length === 0 ? (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 flex justify-center">
                  <PawsLoader size="sm" />
                </div>
              ) : availableHangouts.length > 0 ? (
                <div className="space-y-3">
                  {availableHangouts.map(hangout => (
                    <HangoutListCard
                      key={hangout.id}
                      hangout={hangout}
                      onClick={() => handleHangoutClick(hangout)}
                    />
                  ))}
                  {availableHangouts.length < availableTotal && (
                    <button
                      onClick={handleLoadMoreAvailable}
                      disabled={availableLoading}
                      className="w-full py-2 text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
                    >
                      {availableLoading ? 'Loading...' : `Show more (${availableTotal - availableHangouts.length} remaining)`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                  <p className="text-gray-600">No available hangouts at the moment.</p>
                  <p className="text-sm text-gray-500 mt-1">Suggest a time for one of the pups below!</p>
                </div>
              )}
            </section>

            {/* Your Hangouts & Suggestions */}
            {(myHangouts.length > 0 || friendSuggestions.length > 0 || myTotal > 0) && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Your upcoming hangouts and suggestions
                </h2>
                <HangoutFilters
                  filters={friendMyFilters}
                  onChange={handleFriendMyFilterChange}
                  showStatusFilter={false}
                />
                <div className="space-y-3">
                  {myLoading && myHangouts.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 text-center">
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {myHangouts.map(hangout => (
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
                      {myHangouts.length < myTotal && (
                        <button
                          onClick={handleLoadMoreMy}
                          disabled={myLoading}
                          className="w-full py-2 text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
                        >
                          {myLoading ? 'Loading...' : `Show more (${myTotal - myHangouts.length} remaining)`}
                        </button>
                      )}
                    </>
                  )}
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
                  <p className="text-gray-600">You&apos;re not assigned to care for any pups yet.</p>
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

      {isHangoutDetailsLoading && !selectedHangout && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-gray-700">
            Loading hangout details...
          </div>
        </div>
      )}
    </AppLayout>
  );
}
