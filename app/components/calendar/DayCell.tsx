'use client';

import { format, isSameMonth, isToday } from 'date-fns';
import { CalendarEvent, useCalendar } from './CalendarContext';
import EventPill from './EventPill';

type DayCellProps = {
  date: Date;
  events: CalendarEvent[];
};

export default function DayCell({ date, events }: DayCellProps) {
  const { currentMonth, selectEvent } = useCalendar();
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);

  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );

  // Show max 3 events, then "+X more"
  const maxVisible = 3;
  const visibleEvents = sortedEvents.slice(0, maxVisible);
  const hiddenCount = sortedEvents.length - maxVisible;

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

      <div className="mt-1 space-y-0.5">
        {visibleEvents.map((event) => (
          <EventPill
            key={event.id}
            event={event}
            onClick={() => selectEvent(event)}
            compact={events.length > 2}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => {
              // Select first hidden event to open the sheet
              if (sortedEvents[maxVisible]) {
                selectEvent(sortedEvents[maxVisible]);
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
