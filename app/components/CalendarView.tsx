'use client';

import { memo, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type FullCalendar from '@fullcalendar/react';
import { EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import EventDetailsModal from './EventDetailsModal';
import CalendarSkeleton from './ui/CalendarSkeleton';
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

function CalendarView({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
  onUpdate,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);

  // Memoize hangout events transformation
  const hangoutEvents = useMemo((): EventInput[] => {
    return hangouts.map((hangout) => {
      const isAssigned = hangout.status === 'ASSIGNED' && hangout.assignedFriend;

      let backgroundColor: string;
      if (isAssigned) {
        backgroundColor = actingUserRole === 'OWNER'
          ? getFriendColor(hangout.assignedFriend!.id)
          : getPupColor(hangout.pup.id);
      } else {
        backgroundColor = OPEN_HANGOUT_COLOR;
      }

      const styles = getHangoutStyles(hangout.status);

      return {
        id: hangout.id,
        title: generateHangoutTitle(hangout),
        start: hangout.startAt,
        end: hangout.endAt,
        backgroundColor,
        borderColor: backgroundColor,
        textColor: '#1F2937',
        extendedProps: {
          hangout,
          borderStyle: styles.borderStyle,
          opacity: styles.opacity,
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
