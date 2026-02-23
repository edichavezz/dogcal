'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import EventDetailsModal from './EventDetailsModal';
import HangoutListCard from './home/HangoutListCard';
import HangoutFilters, { HangoutFiltersState, getTimeFilterRange } from './home/HangoutFilters';
import { MonthCalendar, CalendarEvent } from './calendar';
import Link from 'next/link';
import { Calendar, List, Plus, Lightbulb } from 'lucide-react';
import {
  generateHangoutTitle,
  getEventGradientClass,
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
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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

  // Transform hangouts to CalendarEvent format for MonthCalendar
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return hangouts.map((hangout) => ({
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
      colorClass: getEventGradientClass(hangout.assignedFriend?.id || hangout.pup.id),
      hangout,
      seriesId: hangout.seriesId,
      isRecurring: !!hangout.seriesId,
    }));
  }, [hangouts]);

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
    if (event.hangout) {
      try {
        const response = await fetch(`/api/hangouts/${event.id}`);
        const data = await response.json();
        setSelectedHangout(data.hangout);
      } catch (error) {
        console.error('Error fetching hangout details:', error);
      }
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedHangout(null);
  }, []);

  const handleModalUpdate = useCallback(() => {
    setSelectedHangout(null);
    onUpdate();
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

          {/* Create / Suggest button */}
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
        </div>
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
            notes: (selectedHangout.notes ?? []).map((note) => ({
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
