'use client';

import { CalendarProvider, CalendarEvent, useCalendarData } from './CalendarContext';
import { useCalendarGestures } from './useCalendarGestures';
import MonthHeader from './MonthHeader';
import DayGrid from './DayGrid';
import EventSheet from './EventSheet';

type MonthCalendarProps = {
  events: CalendarEvent[];
  onViewDetails?: (event: CalendarEvent) => void;
  currentUserId?: string;
};

function CalendarContent({
  onViewDetails,
  currentUserId,
}: Omit<MonthCalendarProps, 'events'>) {
  const { goToNextMonth, goToPrevMonth } = useCalendarData();

  // Swipe gestures for month navigation
  const { handlers, swipeOffset, isAnimating } = useCalendarGestures({
    onSwipeLeft: goToNextMonth,
    onSwipeRight: goToPrevMonth,
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <MonthHeader />

      <div
        {...handlers}
        className="flex-1 overflow-hidden swipe-container"
      >
        <div
          className="h-full calendar-month-slide"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isAnimating ? 'transform 0.15s ease-out' : 'none',
          }}
        >
          <DayGrid />
        </div>
      </div>

      <EventSheet
        onViewDetails={onViewDetails}
        currentUserId={currentUserId}
      />
    </div>
  );
}

export default function MonthCalendar(props: MonthCalendarProps) {
  return (
    <CalendarProvider events={props.events}>
      <CalendarContent
        onViewDetails={props.onViewDetails}
        currentUserId={props.currentUserId}
      />
    </CalendarProvider>
  );
}

// Re-export types for convenience
export type { CalendarEvent } from './CalendarContext';
