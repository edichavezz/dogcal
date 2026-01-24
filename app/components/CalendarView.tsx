'use client';

import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import EventDetailsModal from './EventDetailsModal';

type Hangout = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  ownerNotes?: string | null;
  pup: {
    name: string;
    careInstructions?: string | null;
    owner: {
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
  const events: EventInput[] = hangouts.map((hangout) => ({
    id: hangout.id,
    title: `${hangout.pup.name}${
      hangout.assignedFriend ? ` - ${hangout.assignedFriend.name}` : ' (Open)'
    }`,
    start: hangout.startAt,
    end: hangout.endAt,
    backgroundColor:
      hangout.status === 'OPEN'
        ? '#FCD34D' // yellow
        : hangout.status === 'ASSIGNED'
        ? '#FB923C' // orange
        : '#9CA3AF', // gray for completed/cancelled
    borderColor:
      hangout.status === 'OPEN'
        ? '#F59E0B'
        : hangout.status === 'ASSIGNED'
        ? '#EA580C'
        : '#6B7280',
    textColor: '#1F2937', // dark gray text
    extendedProps: {
      hangout,
    },
  }));

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

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6">
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
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
          editable={false}
          selectable={false}
        />
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
