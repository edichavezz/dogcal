'use client';

import { memo } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { CalendarEvent } from './CalendarContext';
import EventPill from './EventPill';

type DayCellProps = {
  date: Date;
  events: CalendarEvent[];
  currentMonth: Date;
  onSelectEvent: (event: CalendarEvent | null) => void;
};

function DayCell({ date, events, currentMonth, onSelectEvent }: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);

  // Show max 3 events, then "+X more"
  const maxVisible = 3;
  const visibleEvents = events.slice(0, maxVisible);
  const hiddenCount = events.length - maxVisible;

  return (
    <div
      className={`
        calendar-day
        ${!isCurrentMonth ? 'calendar-day-outside' : ''}
        ${isTodayDate ? 'calendar-day-today today-highlight' : ''}
      `}
    >
      <div
        className={`
          calendar-day-number
          ${isTodayDate ? 'bg-[#1a3a3a] text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''}
        `}
      >
        {format(date, 'd')}
      </div>

      <div className="mt-1 min-h-0 space-y-0.5 overflow-hidden">
        {visibleEvents.map((event) => (
          <EventPill
            key={event.id}
            event={event}
            onClick={() => onSelectEvent(event)}
            compact={events.length > 2}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => {
              // Select first hidden event to open the sheet
              if (events[maxVisible]) {
                onSelectEvent(events[maxVisible]);
              }
            }}
            className="text-[10px] text-slate-500 hover:text-slate-700 w-full text-left pl-1"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(DayCell);
