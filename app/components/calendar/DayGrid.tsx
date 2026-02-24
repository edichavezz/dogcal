'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { CalendarEvent, useCalendarActions, useCalendarData } from './CalendarContext';
import DayCell from './DayCell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_STARTS_ON = 1 as const;
const EMPTY_EVENTS: CalendarEvent[] = [];

export default function DayGrid() {
  const { currentMonth, events } = useCalendarData();
  const { selectEvent } = useCalendarActions();

  // Get all days to display in the calendar grid
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

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
    <div className="flex-1 flex flex-col bg-white">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 calendar-grid">
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
