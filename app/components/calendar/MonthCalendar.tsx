'use client';

import { useEffect } from 'react';
import { CalendarProvider, CalendarEvent, useCalendarData, useCalendarSheet, useCalendarActions } from './CalendarContext';
import { useCalendarGestures } from './useCalendarGestures';
import MonthHeader from './MonthHeader';
import DayGrid from './DayGrid';

type MonthCalendarProps = {
  events: CalendarEvent[];
  onViewDetails?: (event: CalendarEvent) => void;
  currentUserId?: string;
};

function CalendarContent({
  onViewDetails,
}: Omit<MonthCalendarProps, 'events'>) {
  const { goToNextMonth, goToPrevMonth, goToNext3Days, goToPrev3Days, isMobileView } = useCalendarData();
  const { selectedEvent, isSheetOpen } = useCalendarSheet();
  const { closeSheet } = useCalendarActions();

  // Skip the bottom sheet — open the full modal directly
  useEffect(() => {
    if (isSheetOpen && selectedEvent && onViewDetails) {
      closeSheet();
      onViewDetails(selectedEvent);
    }
  }, [isSheetOpen, selectedEvent, onViewDetails, closeSheet]);

  // Swipe gestures: navigate by 3 days on mobile, by month on desktop
  const { handlers, swipeOffset, isAnimating } = useCalendarGestures({
    onSwipeLeft: isMobileView ? goToNext3Days : goToNextMonth,
    onSwipeRight: isMobileView ? goToPrev3Days : goToPrevMonth,
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
    </div>
  );
}

export default function MonthCalendar(props: MonthCalendarProps) {
  return (
    <CalendarProvider events={props.events}>
      <CalendarContent
        onViewDetails={props.onViewDetails}
      />
    </CalendarProvider>
  );
}

// Re-export types for convenience
export type { CalendarEvent } from './CalendarContext';
