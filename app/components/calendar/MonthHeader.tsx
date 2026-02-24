'use client';

import { format, addDays, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarData } from './CalendarContext';

export default function MonthHeader() {
  const {
    currentMonth,
    mobileFocusDate,
    isMobileView,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    goToNext3Days,
    goToPrev3Days,
  } = useCalendarData();

  if (isMobileView) {
    const endDate = addDays(mobileFocusDate, 2);
    const rangeLabel = isSameMonth(mobileFocusDate, endDate)
      ? `${format(mobileFocusDate, 'd')}–${format(endDate, 'd MMM yyyy')}`
      : `${format(mobileFocusDate, 'd MMM')}–${format(endDate, 'd MMM yyyy')}`;

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const windowIncludesToday = [mobileFocusDate, addDays(mobileFocusDate, 1), endDate]
      .some(d => format(d, 'yyyy-MM-dd') === todayKey);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <button
          onClick={goToPrev3Days}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Previous 3 days"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>

        <button onClick={goToToday} className="flex flex-col items-center" aria-label="Go to today">
          <h2 className="text-lg font-semibold text-slate-900 font-display">
            {rangeLabel}
          </h2>
          {!windowIncludesToday && (
            <span className="text-xs text-[#f4a9a8] font-medium">Tap to go to today</span>
          )}
        </button>

        <button
          onClick={goToNext3Days}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Next 3 days"
        >
          <ChevronRight className="w-6 h-6 text-slate-600" />
        </button>
      </div>
    );
  }

  // Desktop: month navigation
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

      <button
        onClick={goToToday}
        className="flex flex-col items-center"
        aria-label="Go to today"
      >
        <h2 className="text-lg font-semibold text-slate-900 font-display">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        {!isCurrentMonth && (
          <span className="text-xs text-[#f4a9a8] font-medium">
            Tap to go to today
          </span>
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
