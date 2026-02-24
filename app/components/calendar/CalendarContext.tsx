'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { startOfMonth, addMonths, subMonths, startOfDay, addDays, subDays } from 'date-fns';

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
  assignedFriendPhotoUrl?: string | null;
  colorClass: string;
  hangout?: unknown;
  seriesId?: string | null;
  isRecurring?: boolean;
};

type CalendarDataContextType = {
  currentMonth: Date;
  mobileFocusDate: Date;
  isMobileView: boolean;
  events: CalendarEvent[];
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  goToNext3Days: () => void;
  goToPrev3Days: () => void;
};

type CalendarSheetContextType = {
  selectedEvent: CalendarEvent | null;
  isSheetOpen: boolean;
};

type CalendarActionsContextType = {
  selectEvent: (event: CalendarEvent | null) => void;
  openSheet: () => void;
  closeSheet: () => void;
};

const CalendarDataContext = createContext<CalendarDataContextType | null>(null);
const CalendarSheetContext = createContext<CalendarSheetContextType | null>(null);
const CalendarActionsContext = createContext<CalendarActionsContextType | null>(null);

type CalendarProviderProps = {
  children: ReactNode;
  events: CalendarEvent[];
};

export function CalendarProvider({ children, events }: CalendarProviderProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mobileFocusDate, setMobileFocusDate] = useState(() => startOfDay(new Date()));
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobileView(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobileView(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
    setMobileFocusDate(startOfDay(new Date()));
  }, []);

  const goToNext3Days = useCallback(() => {
    setMobileFocusDate(prev => addDays(prev, 3));
  }, []);

  const goToPrev3Days = useCallback(() => {
    setMobileFocusDate(prev => subDays(prev, 3));
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

  const dataValue = useMemo(() => ({
    currentMonth,
    mobileFocusDate,
    isMobileView,
    events,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    goToNext3Days,
    goToPrev3Days,
  }), [currentMonth, mobileFocusDate, isMobileView, events, goToNextMonth, goToPrevMonth, goToToday, goToNext3Days, goToPrev3Days]);

  const sheetValue = useMemo(() => ({
    selectedEvent,
    isSheetOpen,
  }), [selectedEvent, isSheetOpen]);

  const actionsValue = useMemo(() => ({
    selectEvent,
    openSheet,
    closeSheet,
  }), [selectEvent, openSheet, closeSheet]);

  return (
    <CalendarDataContext.Provider value={dataValue}>
      <CalendarActionsContext.Provider value={actionsValue}>
        <CalendarSheetContext.Provider value={sheetValue}>
          {children}
        </CalendarSheetContext.Provider>
      </CalendarActionsContext.Provider>
    </CalendarDataContext.Provider>
  );
}

export function useCalendarData() {
  const context = useContext(CalendarDataContext);
  if (!context) {
    throw new Error('useCalendarData must be used within a CalendarProvider');
  }
  return context;
}

export function useCalendarSheet() {
  const context = useContext(CalendarSheetContext);
  if (!context) {
    throw new Error('useCalendarSheet must be used within a CalendarProvider');
  }
  return context;
}

export function useCalendarActions() {
  const context = useContext(CalendarActionsContext);
  if (!context) {
    throw new Error('useCalendarActions must be used within a CalendarProvider');
  }
  return context;
}

// Backward-compatible combined hook.
export function useCalendar() {
  return {
    ...useCalendarData(),
    ...useCalendarSheet(),
    ...useCalendarActions(),
  };
}
