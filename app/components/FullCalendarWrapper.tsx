'use client';

import { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
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
    profilePhotoUrl?: string | null;
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
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // Detect mobile on mount and window resize
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Mini avatar component for calendar events
    const MiniAvatar = ({ photoUrl, name, className = '' }: { photoUrl?: string | null; name: string; className?: string }) => {
      if (photoUrl) {
        return (
          <img
            src={photoUrl}
            alt={name}
            className={`w-5 h-5 rounded-full object-cover flex-shrink-0 ${className}`}
          />
        );
      }
      return (
        <div className={`w-5 h-5 rounded-full bg-[#f4a9a8] flex items-center justify-center flex-shrink-0 ${className}`}>
          <span className="text-[8px] font-semibold text-[#1a3a3a]">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    };

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
      const assignedFriend = hangout?.assignedFriend;

      return (
        <div className="flex items-center gap-1 px-1 overflow-hidden">
          {pup && (
            <MiniAvatar photoUrl={pup.profilePhotoUrl} name={pup.name} />
          )}
          {assignedFriend && (
            <MiniAvatar
              photoUrl={assignedFriend.profilePhotoUrl}
              name={assignedFriend.name}
              className="-ml-2 border border-white"
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

    const effectiveIsMobile = isMobile ?? false;

    const headerToolbar = useMemo(() => ({
      left: 'prev,next today',
      center: 'title',
      right: effectiveIsMobile ? 'timeGrid3Day,listWeek' : 'timeGridWeek,listWeek',
    }), [effectiveIsMobile]);

    const views = useMemo(() => ({
      timeGrid3Day: {
        type: 'timeGrid',
        duration: { days: 3 },
        buttonText: '3 Day',
      },
    }), []);

    // Show loading state until we know if it's mobile
    if (isMobile === null) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Calendar */}
        <div className={`flex-1 min-h-0 ${isMobile ? 'mobile-calendar' : 'desktop-calendar'}`}>
          <FullCalendar
            ref={ref}
            plugins={plugins}
            initialView={isMobile ? 'timeGrid3Day' : 'timeGridWeek'}
            headerToolbar={headerToolbar}
            views={views}
            events={events}
            eventClick={onEventClick}
            eventDidMount={onEventDidMount}
            eventContent={renderEventContent}
            height="100%"
            expandRows={false}
            handleWindowResize={true}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            nowIndicator={true}
            editable={false}
            selectable={false}
            stickyHeaderDates={true}
            dayMaxEventRows={6}
            eventMaxStack={3}
            scrollTime="07:00:00"
          />
        </div>
      </div>
    );
  }
);

export default FullCalendarWrapper;
