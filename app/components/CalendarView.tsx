'use client';

import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import EventDetailsModal from './EventDetailsModal';
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

export default function CalendarView({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
  onUpdate,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);

  // Convert hangouts to FullCalendar events
  const events: EventInput[] = hangouts.map((hangout) => {
    const isAssigned = hangout.status === 'ASSIGNED' && hangout.assignedFriend;

    // Color coding logic:
    // - For OWNERS: color by friend (who's taking care of the pup)
    // - For FRIENDS: color by pup (which pup they're caring for)
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
      textColor: '#1F2937', // dark gray text for readability
      extendedProps: {
        hangout,
        borderStyle: styles.borderStyle,
        opacity: styles.opacity,
      },
    };
  });

  // Convert suggestions to FullCalendar events
  const suggestionEvents: EventInput[] = suggestions.map((suggestion) => {
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

  // Combine all events
  const allEvents = [...events, ...suggestionEvents];

  const handleEventClick = async (info: EventClickArg) => {
    // Check if this is a suggestion
    if (info.event.extendedProps.isSuggestion) {
      const suggestion = info.event.extendedProps.suggestion as Suggestion;
      // Navigate to approvals page to see suggestion details
      window.location.href = '/approvals';
      return;
    }

    const hangout = info.event.extendedProps.hangout as Hangout;

    // Fetch full hangout details including notes
    try {
      const response = await fetch(`/api/hangouts/${hangout.id}`);
      const data = await response.json();
      setSelectedHangout(data.hangout);
    } catch (error) {
      console.error('Error fetching hangout details:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedHangout(null);
  };

  const handleModalUpdate = () => {
    handleCloseModal();
    onUpdate();
  };

  const handleEventDidMount = (info: EventMountArg) => {
    const borderStyle = info.event.extendedProps.borderStyle;
    const opacity = info.event.extendedProps.opacity;

    if (borderStyle) {
      info.el.style.borderStyle = borderStyle;
    }
    if (opacity !== undefined) {
      info.el.style.opacity = opacity.toString();
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,listWeek',
            }}
            events={allEvents}
            eventClick={handleEventClick}
            eventDidMount={handleEventDidMount}
            height="100%"
            expandRows={true}
            handleWindowResize={true}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            editable={false}
            selectable={false}
            stickyHeaderDates={true}
            dayMaxEventRows={6}
            eventMaxStack={3}
          />
        </div>
      </div>

      {/* Event Details Modal */}
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
