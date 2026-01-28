'use client';

import { forwardRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';

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

type FullCalendarWrapperProps = {
  events: EventInput[];
  onEventClick: (info: EventClickArg) => void;
  onEventDidMount: (info: EventMountArg) => void;
};

const FullCalendarWrapper = forwardRef<FullCalendar, FullCalendarWrapperProps>(
  function FullCalendarWrapper({ events, onEventClick, onEventDidMount }, ref) {
    const renderEventContent = useCallback((eventInfo: {
      event: {
        extendedProps: { hangout?: Hangout; suggestion?: Suggestion };
        title: string
      };
      timeText: string
    }) => {
      const hangout = eventInfo.event.extendedProps.hangout;
      const suggestion = eventInfo.event.extendedProps.suggestion;
      const pup = hangout?.pup || suggestion?.pup;

      return (
        <div className="flex items-center gap-1 px-1 overflow-hidden">
          {pup?.profilePhotoUrl && (
            <img
              src={pup.profilePhotoUrl}
              alt={pup.name}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold truncate">{eventInfo.timeText}</div>
            <div className="text-xs truncate">{eventInfo.event.title}</div>
          </div>
        </div>
      );
    }, []);

    const plugins = useMemo(() => [timeGridPlugin, listPlugin, interactionPlugin], []);

    const headerToolbar = useMemo(() => ({
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,listWeek',
    }), []);

    return (
      <FullCalendar
        ref={ref}
        plugins={plugins}
        initialView="timeGridWeek"
        headerToolbar={headerToolbar}
        events={events}
        eventClick={onEventClick}
        eventDidMount={onEventDidMount}
        eventContent={renderEventContent}
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
    );
  }
);

export default FullCalendarWrapper;
