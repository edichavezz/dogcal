'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { useCalendar } from './CalendarContext';
import DayCell from './DayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DayGrid() {
  const { currentMonth, events } = useCalendar();

  // Get all days to display in the calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = new Map<string, typeof events>();
  events.forEach((event) => {
    const dateKey = event.startAt.toISOString().split('T')[0];
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

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
          const dayEvents = eventsByDate.get(dateKey) || [];

          return (
            <DayCell key={day.toISOString()} date={day} events={dayEvents} />
          );
        })}
      </div>
    </div>
  );
}
