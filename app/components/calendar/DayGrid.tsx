'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  format,
} from 'date-fns';
import { CalendarEvent, useCalendarActions, useCalendarData } from './CalendarContext';
import DayCell from './DayCell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_STARTS_ON = 1 as const;
const EMPTY_EVENTS: CalendarEvent[] = [];

export default function DayGrid() {
  const { currentMonth, events, mobileFocusDate, isMobileView, mobileViewMode } = useCalendarData();
  const { selectEvent } = useCalendarActions();

  const show3Day = isMobileView && mobileViewMode === '3day';

  const days = useMemo(() => {
    if (show3Day) {
      return [mobileFocusDate, addDays(mobileFocusDate, 1), addDays(mobileFocusDate, 2)];
    }
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth, show3Day, mobileFocusDate]);

  const weekdayHeaders = show3Day ? days.map((d) => format(d, 'EEE')) : WEEKDAYS;

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, typeof events>();
    for (const event of events) {
      const dateKey = event.startAt.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    }
    for (const dayEvents of grouped.values()) {
      dayEvents.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }
    return grouped;
  }, [events]);

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Weekday headers */}
      <div className={`grid ${show3Day ? 'grid-cols-3' : 'grid-cols-7'} border-b border-slate-200`}>
        {weekdayHeaders.map((day, i) => (
          <div key={i} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`flex-1 min-h-0 ${show3Day ? 'calendar-grid-3col' : 'calendar-grid'}`}>
        {days.map((day) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateKey) ?? EMPTY_EVENTS;
          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              events={dayEvents}
              currentMonth={currentMonth}
              onSelectEvent={selectEvent}
            />
          );
        })}
      </div>
    </div>
  );
}
