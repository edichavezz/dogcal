'use client';

import { format, addDays, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarData } from './CalendarContext';

export default function MonthHeader() {
  const {
    currentMonth,
    mobileFocusDate,
    isMobileView,
    mobileViewMode,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    goToNext3Days,
    goToPrev3Days,
    toggleMobileViewMode,
  } = useCalendarData();

  const show3Day = isMobileView && mobileViewMode === '3day';

  if (isMobileView) {
    // Navigation depends on current mode
    const onPrev = show3Day ? goToPrev3Days : goToPrevMonth;
    const onNext = show3Day ? goToNext3Days : goToNextMonth;

    // Title: date range for 3-day, month name for month view
    let title: string;
    let isAtToday: boolean;
    if (show3Day) {
      const endDate = addDays(mobileFocusDate, 2);
      title = isSameMonth(mobileFocusDate, endDate)
        ? `${format(mobileFocusDate, 'd')}–${format(endDate, 'd MMM yyyy')}`
        : `${format(mobileFocusDate, 'd MMM')}–${format(endDate, 'd MMM yyyy')}`;
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      isAtToday = [mobileFocusDate, addDays(mobileFocusDate, 1), endDate].some(
        (d) => format(d, 'yyyy-MM-dd') === todayKey
      );
    } else {
      title = format(currentMonth, 'MMMM yyyy');
      isAtToday = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <button
          onClick={onPrev}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label={show3Day ? 'Previous 3 days' : 'Previous month'}
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>

        <button onClick={goToToday} className="flex flex-col items-center" aria-label="Go to today">
          <h2 className="text-base font-semibold text-slate-900 font-display">{title}</h2>
          {!isAtToday && (
            <span className="text-xs text-[#f4a9a8] font-medium">Tap to go to today</span>
          )}
        </button>

        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={toggleMobileViewMode}
            className="flex items-center justify-center px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            aria-label={show3Day ? 'Switch to month view' : 'Switch to 3-day view'}
          >
            {show3Day ? 'Month' : '3-day'}
          </button>

          <button
            onClick={onNext}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label={show3Day ? 'Next 3 days' : 'Next month'}
          >
            <ChevronRight className="w-6 h-6 text-slate-600" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop: month navigation only
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
      <button
        onClick={goToPrevMonth}
        className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-6 h-6 text-slate-600" />
      </button>

      <button onClick={goToToday} className="flex flex-col items-center" aria-label="Go to today">
        <h2 className="text-lg font-semibold text-slate-900 font-display">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        {!isCurrentMonth && (
          <span className="text-xs text-[#f4a9a8] font-medium">Tap to go to today</span>
        )}
      </button>

      <button
        onClick={goToNextMonth}
        className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-6 h-6 text-slate-600" />
      </button>
    </div>
  );
}
