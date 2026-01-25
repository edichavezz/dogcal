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
  OPEN_HANGOUT_COLOR,
  generateHangoutTitle,
  getHangoutStyles,
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

type CalendarViewProps = {
  hangouts: Hangout[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
  onUpdate: () => void;
};

export default function CalendarView({
  hangouts,
  actingUserId,
  actingUserRole,
  onUpdate,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);

  // Convert hangouts to FullCalendar events
  const events: EventInput[] = hangouts.map((hangout) => {
    const isAssigned = hangout.status === 'ASSIGNED' && hangout.assignedFriend;
    const backgroundColor = isAssigned
      ? getFriendColor(hangout.assignedFriend!.id)
      : OPEN_HANGOUT_COLOR;
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

  const handleEventClick = async (info: EventClickArg) => {
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
            events={events}
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
