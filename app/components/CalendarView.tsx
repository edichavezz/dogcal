'use client';

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import EventDetailsModal from './EventDetailsModal';
import SuggestionDetailsModal from './SuggestionDetailsModal';
import HangoutListCard from './home/HangoutListCard';
import SuggestionPreviewCard from './home/SuggestionPreviewCard';
import HangoutFilters, { HangoutFiltersState, getTimeFilterRange } from './home/HangoutFilters';
import { MonthCalendar, CalendarEvent } from './calendar';
import Link from 'next/link';
import { Calendar, List, Plus, Lightbulb } from 'lucide-react';
import {
  generateHangoutTitle,
  generateSuggestionTitle,
  getEventGradientClass,
  getFriendColor,
} from '@/lib/colorUtils';

type Hangout = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  ownerNotes?: string | null;
  eventName: string | null;
  seriesId?: string | null;
  seriesIndex?: number | null;
  pup: {
    id: string;
    name: string;
    careInstructions?: string | null;
    profilePhotoUrl?: string | null;
    owner: {
      id: string;
      name: string;
    };
    friendships?: Array<{ friend: { id: string; name: string } }>;
  };
  assignedFriend?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  } | null;
  notes?: Array<{
    id: string;
    noteText: string;
    createdAt: Date;
    author: {
      name: string;
    };
  }>;
};

type Suggestion = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  friendComment?: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
  suggestedByFriend: {
    id: string;
    name: string;
  };
};

type PupInfo = {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
};

type CalendarViewProps = {
  hangouts: Hangout[];
  suggestions: Suggestion[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
  onUpdate?: () => void;
  ownedPups?: PupInfo[];
  friendPups?: PupInfo[];
};

type ViewMode = 'calendar' | 'list';

// Shape of hangout data coming from EventDetailsModal (API dates are strings, status is string)
type ModalHangout = Omit<Hangout, 'startAt' | 'endAt' | 'status' | 'notes'> & {
  startAt: string;
  endAt: string;
  status: string;
  notes?: Array<{ id: string; noteText: string; createdAt: string; author: { name: string } }>;
};

function CalendarView({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
  onUpdate,
  ownedPups = [],
  friendPups = [],
}: CalendarViewProps) {
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Local optimistic state — updated immediately on mutations
  const [hangoutsState, setHangoutsState] = useState(hangouts);

  // Sync when server re-renders push new data (e.g. after suggestion approval)
  useEffect(() => {
    setHangoutsState(hangouts);
  }, [hangouts]);

  // Filters state - default to "week" for calendar list
  const [filters, setFilters] = useState<HangoutFiltersState>({
    timeRange: 'week',
    status: 'all',
    hideRepeats: false,
  });

  // Pup filter state
  const allPups = useMemo(() => [...ownedPups, ...friendPups], [ownedPups, friendPups]);
  const [selectedPupIds, setSelectedPupIds] = useState<Set<string>>(
    () => new Set(allPups.map((p) => p.id))
  );

  const togglePup = useCallback((pupId: string) => {
    setSelectedPupIds((prev) => {
      const next = new Set(prev);
      if (next.has(pupId)) {
        next.delete(pupId);
      } else {
        next.add(pupId);
      }
      return next;
    });
  }, []);

  const selectAllPups = useCallback(() => {
    setSelectedPupIds(new Set(allPups.map((p) => p.id)));
  }, [allPups]);

  const selectNoPups = useCallback(() => {
    setSelectedPupIds(new Set());
  }, []);

  // Pups that actually appear in event data (used for legend + filter pills)
  const pupsWithEvents = useMemo(() => {
    const ids = new Set(hangoutsState.map((h) => h.pup.id));
    return allPups.filter((p) => ids.has(p.id));
  }, [hangoutsState, allPups]);

  // Friends that appear as assigned in event data (used for legend)
  const friendsInEvents = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string; profilePhotoUrl?: string | null }[] = [];
    for (const h of hangoutsState) {
      if (h.assignedFriend && !seen.has(h.assignedFriend.id)) {
        seen.add(h.assignedFriend.id);
        result.push(h.assignedFriend);
      }
    }
    return result;
  }, [hangoutsState]);

  // Hangouts filtered by selected pups (applied before time/status filters)
  const pupFilteredHangouts = useMemo(
    () => (allPups.length > 1 ? hangoutsState.filter((h) => selectedPupIds.has(h.pup.id)) : hangoutsState),
    [hangoutsState, allPups.length, selectedPupIds]
  );

  // Filter hangouts for list view
  const filteredHangouts = useMemo(() => {
    let filtered = [...pupFilteredHangouts];

    // Apply time filter
    const timeRange = getTimeFilterRange(filters.timeRange);
    if (timeRange) {
      filtered = filtered.filter(h => {
        const start = new Date(h.startAt);
        return start >= timeRange.start && start <= timeRange.end;
      });
    }

    // Apply status filter
    if (filters.status === 'open') {
      filtered = filtered.filter(h => h.status === 'OPEN');
    } else if (filters.status === 'confirmed') {
      filtered = filtered.filter(h => h.status === 'ASSIGNED');
    }

    // Apply hide repeats filter
    if (filters.hideRepeats) {
      const seenSeries = new Set<string>();
      filtered = filtered.filter(h => {
        if (!h.seriesId) return true;
        if (seenSeries.has(h.seriesId)) return false;
        seenSeries.add(h.seriesId);
        return true;
      });
    }

    // Sort by start date
    filtered.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return filtered;
  }, [pupFilteredHangouts, filters]);

  // Suggestions filtered by selected pups
  const pupFilteredSuggestions = useMemo(
    () => (allPups.length > 1 ? suggestions.filter((s) => selectedPupIds.has(s.pup.id)) : suggestions),
    [suggestions, allPups.length, selectedPupIds]
  );

  // Suggestions filtered by time range for the list view
  const filteredSuggestionsForList = useMemo(() => {
    let filtered = [...pupFilteredSuggestions];
    const timeRange = getTimeFilterRange(filters.timeRange);
    if (timeRange) {
      filtered = filtered.filter((s) => {
        const start = new Date(s.startAt);
        return start >= timeRange.start && start <= timeRange.end;
      });
    }
    return filtered;
  }, [pupFilteredSuggestions, filters.timeRange]);

  // Transform hangouts + suggestions to CalendarEvent format for MonthCalendar
  const calendarEvents = useMemo((): CalendarEvent[] => {
    const hangoutEvents = pupFilteredHangouts.map((hangout) => ({
      id: hangout.id,
      title: hangout.eventName || generateHangoutTitle(hangout),
      startAt: new Date(hangout.startAt),
      endAt: new Date(hangout.endAt),
      type: 'hangout' as const,
      status: hangout.status,
      pupId: hangout.pup.id,
      pupName: hangout.pup.name,
      pupPhotoUrl: hangout.pup.profilePhotoUrl,
      assignedFriendId: hangout.assignedFriend?.id,
      assignedFriendName: hangout.assignedFriend?.name,
      assignedFriendPhotoUrl: hangout.assignedFriend?.profilePhotoUrl,
      colorClass: getEventGradientClass(hangout.pup.id),
      hangout,
      seriesId: hangout.seriesId,
      isRecurring: !!hangout.seriesId,
    }));

    const suggestionEvents = pupFilteredSuggestions.map((suggestion) => ({
      id: suggestion.id,
      title: generateSuggestionTitle(suggestion),
      startAt: new Date(suggestion.startAt),
      endAt: new Date(suggestion.endAt),
      type: 'suggestion' as const,
      status: 'PENDING',
      pupId: suggestion.pup.id,
      pupName: suggestion.pup.name,
      pupPhotoUrl: suggestion.pup.profilePhotoUrl,
      colorClass: getEventGradientClass(suggestion.pup.id),
    }));

    return [...hangoutEvents, ...suggestionEvents];
  }, [pupFilteredHangouts, pupFilteredSuggestions]);

  // Handle list item click
  const handleListItemClick = useCallback(async (hangout: Hangout) => {
    try {
      const response = await fetch(`/api/hangouts/${hangout.id}`);
      const data = await response.json();
      setSelectedHangout(data.hangout);
    } catch (error) {
      console.error('Error fetching hangout details:', error);
    }
  }, []);

  // Handle calendar event view details
  const handleViewDetails = useCallback(async (event: CalendarEvent) => {
    if (event.type === 'suggestion') {
      const s = suggestions.find((s) => s.id === event.id);
      if (s) setSelectedSuggestion(s);
      return;
    }
    if (event.hangout) {
      try {
        const response = await fetch(`/api/hangouts/${event.id}`);
        const data = await response.json();
        setSelectedHangout(data.hangout);
      } catch (error) {
        console.error('Error fetching hangout details:', error);
      }
    }
  }, [suggestions]);

  const handleListSuggestionClick = useCallback((suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedHangout(null);
  }, []);

  const handleCloseSuggestionModal = useCallback(() => {
    setSelectedSuggestion(null);
  }, []);

  // Optimistic update: merge the updated hangout into local state immediately
  const handleModalUpdate = useCallback((updatedHangout: ModalHangout) => {
    const mergeIntoCalHangout = (h: Hangout): Hangout => ({
      ...h,
      ...updatedHangout,
      status: updatedHangout.status as Hangout['status'],
      startAt: new Date(updatedHangout.startAt),
      endAt: new Date(updatedHangout.endAt),
      pup: { ...h.pup, ...updatedHangout.pup },
      notes: updatedHangout.notes
        ? updatedHangout.notes.map(n => ({ ...n, createdAt: new Date(n.createdAt) }))
        : h.notes,
    });

    setSelectedHangout(prev => prev ? mergeIntoCalHangout(prev) : null);
    setHangoutsState(prev =>
      prev.map(h => h.id === updatedHangout.id ? mergeIntoCalHangout(h) : h)
    );
  }, []);

  // Optimistic delete: remove from local state immediately
  const handleModalDelete = useCallback((id: string) => {
    setSelectedHangout(null);
    setHangoutsState(prev => prev.filter(h => h.id !== id));
  }, []);

  const handleSuggestionModalUpdate = useCallback(() => {
    setSelectedSuggestion(null);
    onUpdate?.();
  }, [onUpdate]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* View Toggle and Filters */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Filters - only show for list view */}
          {viewMode === 'list' && (
            <HangoutFilters
              filters={filters}
              onChange={setFilters}
              showStatusFilter={actingUserRole === 'OWNER'}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {ownedPups.length > 0 && (
              <Link
                href="/hangouts/new"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1a3a3a] text-white hover:bg-[#2a4a4a] transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Hangout
              </Link>
            )}
            {friendPups.length > 0 && (
              <Link
                href="/suggest"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1a3a3a] text-white hover:bg-[#2a4a4a] transition-colors"
              >
                <Lightbulb className="w-4 h-4" /> Suggest Time
              </Link>
            )}
            {/* Fallback for users with neither (shouldn't happen) */}
            {ownedPups.length === 0 && friendPups.length === 0 && (
              <Link
                href={actingUserRole === 'OWNER' ? '/hangouts/new' : '/suggest'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1a3a3a] text-white hover:bg-[#2a4a4a] transition-colors"
              >
                {actingUserRole === 'OWNER' ? (
                  <><Plus className="w-4 h-4" /> Create Hangout</>
                ) : (
                  <><Lightbulb className="w-4 h-4" /> Suggest Time</>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Pup filter pills — only shown when ≥2 pups have events */}
        {pupsWithEvents.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {pupsWithEvents.length > 2 && (
              <>
                <button
                  onClick={selectAllPups}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={selectNoPups}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  None
                </button>
              </>
            )}
            {pupsWithEvents.map((pup) => (
              <button
                key={pup.id}
                onClick={() => togglePup(pup.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedPupIds.has(pup.id)
                    ? getEventGradientClass(pup.id) + ' text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {pup.name}
              </button>
            ))}
          </div>
        )}
        {/* Friend legend row — only shown when ≥1 assigned friend exists in data */}
        {friendsInEvents.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-xs text-gray-400">Friends:</span>
            {friendsInEvents.map((f) => (
              <span key={f.id} className="flex items-center gap-1 text-xs text-gray-600">
                <Avatar
                  name={f.name}
                  photoUrl={f.profilePhotoUrl}
                  size="xs"
                  style={{ border: `2px solid ${getFriendColor(f.id)}` }}
                />
                {f.name.split(' ')[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <MonthCalendar
              events={calendarEvents}
              onViewDetails={handleViewDetails}
              currentUserId={actingUserId}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto p-4">
            {filteredHangouts.length > 0 || filteredSuggestionsForList.length > 0 ? (
              <div className="space-y-3">
                {[
                  ...filteredHangouts.map((h) => ({ type: 'hangout' as const, startAt: new Date(h.startAt), id: h.id, hangout: h })),
                  ...filteredSuggestionsForList.map((s) => ({ type: 'suggestion' as const, startAt: new Date(s.startAt), id: s.id, suggestion: s })),
                ]
                  .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
                  .map((item) =>
                    item.type === 'hangout' ? (
                      <HangoutListCard
                        key={item.id}
                        hangout={{
                          ...item.hangout,
                          startAt: item.hangout.startAt.toString(),
                          endAt: item.hangout.endAt.toString(),
                        }}
                        onClick={() => handleListItemClick(item.hangout)}
                      />
                    ) : (
                      <SuggestionPreviewCard
                        key={item.id}
                        suggestion={{
                          id: item.suggestion.id,
                          startAt: item.suggestion.startAt.toString(),
                          endAt: item.suggestion.endAt.toString(),
                          eventName: null,
                          friendComment: item.suggestion.friendComment,
                          pup: item.suggestion.pup,
                          suggestedByFriend: item.suggestion.suggestedByFriend,
                        }}
                        showFriend={true}
                        onClick={() => handleListSuggestionClick(item.suggestion)}
                      />
                    )
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <p className="text-gray-600">No hangouts found for the selected filters.</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or check back later.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedHangout && (
        <EventDetailsModal
          hangout={{
            ...selectedHangout,
            startAt: selectedHangout.startAt.toString(),
            endAt: selectedHangout.endAt.toString(),
            notes: (selectedHangout.notes ?? []).map((note) => ({
              ...note,
              createdAt: note.createdAt.toString(),
            })),
          }}
          actingUserId={actingUserId}
          actingUserRole={actingUserRole}
          onClose={handleCloseModal}
          onUpdate={handleModalUpdate}
          onDelete={handleModalDelete}
        />
      )}
      {selectedSuggestion && (
        <SuggestionDetailsModal
          suggestion={selectedSuggestion}
          actingUserId={actingUserId}
          onClose={handleCloseSuggestionModal}
          onUpdate={handleSuggestionModalUpdate}
        />
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(CalendarView);
