'use client';

import { memo, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type FullCalendar from '@fullcalendar/react';
import { EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import EventDetailsModal from './EventDetailsModal';
import CalendarSkeleton from './ui/CalendarSkeleton';
import HangoutListCard from './home/HangoutListCard';
import HangoutFilters, { HangoutFiltersState, getTimeFilterRange } from './home/HangoutFilters';
import { Calendar, List, Repeat } from 'lucide-react';
import {
  getFriendColor,
  getPupColor,
  OPEN_HANGOUT_COLOR,
  SUGGESTED_HANGOUT_COLOR,
  generateHangoutTitle,
  generateSuggestionTitle,
  getHangoutStyles,
  getSuggestionStyles,
} from '@/lib/colorUtils';

// Dynamic import of FullCalendar with no SSR - this reduces initial bundle by ~150KB
const FullCalendarWrapper = dynamic(
  () => import('./FullCalendarWrapper'),
  {
    ssr: false,
    loading: () => <CalendarSkeleton message="Loading calendar..." />,
  }
);

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
    owner: {
      id: string;
      name: string;
    };
  };
  suggestedByFriend: {
    id: string;
    name: string;
  };
};

type CalendarViewProps = {
  hangouts: Hangout[];
  suggestions: Suggestion[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
  onUpdate: () => void;
};

type ViewMode = 'calendar' | 'list';

function CalendarView({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
  onUpdate,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filters state - default to "week" for calendar list
  const [filters, setFilters] = useState<HangoutFiltersState>({
    timeRange: 'week',
    status: 'all',
    hideRepeats: false,
  });

  // Filter hangouts for list view
  const filteredHangouts = useMemo(() => {
    let filtered = [...hangouts];

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
  }, [hangouts, filters]);

  // Memoize hangout events transformation for calendar
  const hangoutEvents = useMemo((): EventInput[] => {
    return hangouts.map((hangout) => {
      const isAssigned = hangout.status === 'ASSIGNED' && hangout.assignedFriend;
      const isRecurring = !!hangout.seriesId;

      let backgroundColor: string;
      if (isAssigned) {
        backgroundColor = actingUserRole === 'OWNER'
          ? getFriendColor(hangout.assignedFriend!.id)
          : getPupColor(hangout.pup.id);
      } else {
        backgroundColor = OPEN_HANGOUT_COLOR;
      }

      const styles = getHangoutStyles(hangout.status);

      // Add repeat indicator to title if recurring
      const title = isRecurring
        ? `🔄 ${generateHangoutTitle(hangout)}`
        : generateHangoutTitle(hangout);

      return {
        id: hangout.id,
        title,
        start: hangout.startAt,
        end: hangout.endAt,
        backgroundColor,
        borderColor: backgroundColor,
        textColor: '#1F2937',
        extendedProps: {
          hangout,
          borderStyle: styles.borderStyle,
          opacity: styles.opacity,
          isRecurring,
        },
      };
    });
  }, [hangouts, actingUserRole]);

  // Memoize suggestion events transformation
  const suggestionEvents = useMemo((): EventInput[] => {
    return suggestions.map((suggestion) => {
      const styles = getSuggestionStyles();

      return {
        id: `suggestion-${suggestion.id}`,
        title: `[Suggested] ${generateSuggestionTitle(suggestion)}`,
        start: suggestion.startAt,
        end: suggestion.endAt,
        backgroundColor: SUGGESTED_HANGOUT_COLOR,
        borderColor: SUGGESTED_HANGOUT_COLOR,
        textColor: '#1F2937',
        extendedProps: {
          suggestion,
          isSuggestion: true,
          borderStyle: styles.borderStyle,
          opacity: styles.opacity,
        },
      };
    });
  }, [suggestions]);

  // Combine all events
  const allEvents = useMemo(
    () => [...hangoutEvents, ...suggestionEvents],
    [hangoutEvents, suggestionEvents]
  );

  // Memoize event click handler
  const handleEventClick = useCallback(async (info: EventClickArg) => {
    if (info.event.extendedProps.isSuggestion) {
      window.location.href = '/approvals';
      return;
    }

    const hangout = info.event.extendedProps.hangout as Hangout;

    try {
      const response = await fetch(`/api/hangouts/${hangout.id}`);
      const data = await response.json();
      setSelectedHangout(data.hangout);
    } catch (error) {
      console.error('Error fetching hangout details:', error);
    }
  }, []);

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

  const handleCloseModal = useCallback(() => {
    setSelectedHangout(null);
  }, []);

  const handleModalUpdate = useCallback(() => {
    setSelectedHangout(null);
    onUpdate();
  }, [onUpdate]);

  // Memoize event did mount handler
  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const borderStyle = info.event.extendedProps.borderStyle;
    const opacity = info.event.extendedProps.opacity;

    if (borderStyle) {
      info.el.style.borderStyle = borderStyle;
    }
    if (opacity !== undefined) {
      info.el.style.opacity = opacity.toString();
    }
  }, []);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* View Toggle and Filters */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
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
          </div>

          {/* Filters - only show for list view */}
          {viewMode === 'list' && (
            <HangoutFilters
              filters={filters}
              onChange={setFilters}
              showStatusFilter={actingUserRole === 'OWNER'}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 p-4">
              <FullCalendarWrapper
                ref={calendarRef}
                events={allEvents}
                onEventClick={handleEventClick}
                onEventDidMount={handleEventDidMount}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto p-4">
            {filteredHangouts.length > 0 ? (
              <div className="space-y-3">
                {filteredHangouts.map((hangout) => (
                  <HangoutListCard
                    key={hangout.id}
                    hangout={{
                      ...hangout,
                      startAt: hangout.startAt.toString(),
                      endAt: hangout.endAt.toString(),
                    }}
                    onClick={() => handleListItemClick(hangout)}
                  />
                ))}
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
            notes: selectedHangout.notes.map((note) => ({
              ...note,
              createdAt: note.createdAt.toString(),
            })),
          }}
          actingUserId={actingUserId}
          actingUserRole={actingUserRole}
          onClose={handleCloseModal}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(CalendarView);
