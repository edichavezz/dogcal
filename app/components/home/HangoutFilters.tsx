'use client';

import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

export type TimeFilter = 'all' | 'today' | 'week' | 'nextweek';
export type StatusFilter = 'all' | 'open' | 'confirmed';

export type HangoutFiltersState = {
  timeRange: TimeFilter;
  status: StatusFilter;
  hideRepeats: boolean;
};

type HangoutFiltersProps = {
  filters: HangoutFiltersState;
  onChange: (filters: HangoutFiltersState) => void;
  showStatusFilter?: boolean;
};

export function getTimeFilterRange(filter: TimeFilter): { start: Date; end: Date } | null {
  const now = new Date();

  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'nextweek': {
      const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
      return { start: nextWeekStart, end: nextWeekEnd };
    }
    case 'all':
    default:
      return null;
  }
}

export default function HangoutFilters({ filters, onChange, showStatusFilter = true }: HangoutFiltersProps) {
  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'nextweek', label: 'Next week' },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'confirmed', label: 'Confirmed' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Time Filter */}
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        {timeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onChange({ ...filters, timeRange: option.value })}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filters.timeRange === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      {showStatusFilter && (
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onChange({ ...filters, status: option.value })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.status === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Hide Repeats Toggle */}
      <button
        onClick={() => onChange({ ...filters, hideRepeats: !filters.hideRepeats })}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border ${
          filters.hideRepeats
            ? 'bg-teal-50 text-teal-700 border-teal-200'
            : 'bg-gray-100 text-gray-600 border-transparent hover:text-gray-900'
        }`}
      >
        {filters.hideRepeats ? 'Repeats hidden' : 'Hide repeats'}
      </button>
    </div>
  );
}
