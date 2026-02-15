'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { startOfMonth, addMonths, subMonths } from 'date-fns';

// Extended CalendarEvent type with v1's extra fields
export type CalendarEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  type: 'hangout' | 'suggestion';
  status: string;
  pupId: string;
  pupName: string;
  pupPhotoUrl?: string | null;
  assignedFriendId?: string | null;
  assignedFriendName?: string | null;
  assignedFriendPhotoUrl?: string | null;  // NEW: for dual avatar
  colorClass: string;
  hangout?: unknown;                        // NEW: full data for modal
  seriesId?: string | null;                 // NEW: recurring indicator
  isRecurring?: boolean;                    // NEW: recurring indicator
};

type CalendarContextType = {
  currentMonth: Date;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  isSheetOpen: boolean;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  setEvents: (events: CalendarEvent[]) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  openSheet: () => void;
  closeSheet: () => void;
};

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
  }, []);

  const selectEvent = useCallback((event: CalendarEvent | null) => {
    setSelectedEvent(event);
    if (event) {
      setIsSheetOpen(true);
    }
  }, []);

  const openSheet = useCallback(() => {
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedEvent(null);
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        currentMonth,
        events,
        selectedEvent,
        isSheetOpen,
        goToNextMonth,
        goToPrevMonth,
        goToToday,
        setEvents,
        selectEvent,
        openSheet,
        closeSheet,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
