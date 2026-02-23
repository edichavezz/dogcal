'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'fullday' | 'anytime' | 'exact';

type PeriodConfig = {
  label: string;
  defaultStart: string;
  defaultEnd: string;
  description?: string;
};

const PERIOD_CONFIGS: Record<TimePeriod, PeriodConfig> = {
  morning: { label: 'Morning', defaultStart: '08:00', defaultEnd: '12:00' },
  afternoon: { label: 'Afternoon', defaultStart: '12:00', defaultEnd: '17:00' },
  evening: { label: 'Evening', defaultStart: '17:00', defaultEnd: '21:00' },
  fullday: { label: 'Full Day', defaultStart: '08:00', defaultEnd: '21:00' },
  anytime: {
    label: 'Anytime',
    defaultStart: '00:00',
    defaultEnd: '23:59',
    description: 'No time restriction - a hangout during this day would be welcome. Arrange details later.',
  },
  exact: { label: 'Exact Times', defaultStart: '09:00', defaultEnd: '11:00' },
};

type TimePeriodPickerProps = {
  period: TimePeriod;
  startTime: string;
  endTime: string;
  onPeriodChange: (period: TimePeriod) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  error?: string;
};

export default function TimePeriodPicker({
  period,
  startTime,
  endTime,
  onPeriodChange,
  onStartTimeChange,
  onEndTimeChange,
  error,
}: TimePeriodPickerProps) {
  const [showTimeAdjust, setShowTimeAdjust] = useState(period === 'exact');

  // When period changes, update default times unless in exact mode
  useEffect(() => {
    if (period !== 'exact') {
      const config = PERIOD_CONFIGS[period];
      onStartTimeChange(config.defaultStart);
      onEndTimeChange(config.defaultEnd);
      setShowTimeAdjust(false);
    }
  }, [period, onStartTimeChange, onEndTimeChange]);

  const periods: TimePeriod[] = ['morning', 'afternoon', 'evening', 'fullday', 'anytime', 'exact'];

  const handleToggleTimeAdjust = () => {
    if (period === 'exact') return; // Always show for exact
    setShowTimeAdjust(!showTimeAdjust);
  };

  const config = PERIOD_CONFIGS[period];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Time Period
      </label>

      {/* Period pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {periods.map((p) => {
          const isSelected = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#f4a9a8] text-[#1a3a3a] ring-2 ring-[#f4a9a8] ring-offset-2'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#f4a9a8] hover:bg-gray-50'
                }
              `}
            >
              {PERIOD_CONFIGS[p].label}
            </button>
          );
        })}
      </div>

      {/* Helper text for anytime */}
      {period === 'anytime' && config.description && (
        <p className="text-sm text-gray-500 mb-3 italic">
          {config.description}
        </p>
      )}

      {/* Time adjust toggle (hidden for exact times) */}
      {period !== 'exact' && period !== 'anytime' && (
        <button
          type="button"
          onClick={handleToggleTimeAdjust}
          className="flex items-center gap-1 text-sm text-[#1a3a3a] font-medium mb-3 hover:text-[#2a4a4a]"
        >
          {showTimeAdjust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Adjust times
        </button>
      )}

      {/* Time inputs */}
      {(showTimeAdjust || period === 'exact') && (
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f4a9a8] focus:ring-2 focus:ring-[#f4a9a8]/20 outline-none"
            />
          </div>
          <span className="text-gray-400 pt-5">to</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f4a9a8] focus:ring-2 focus:ring-[#f4a9a8]/20 outline-none"
            />
          </div>
        </div>
      )}

      {/* Display selected time badge */}
      {!showTimeAdjust && period !== 'exact' && period !== 'anytime' && (
        <div className="text-sm text-gray-500">
          <span className="font-medium">{config.label}</span>
          <span className="text-gray-400 ml-2">
            {startTime} - {endTime}
          </span>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Helper to get default times for a period
export function getDefaultTimesForPeriod(period: TimePeriod): { startTime: string; endTime: string } {
  const config = PERIOD_CONFIGS[period];
  return {
    startTime: config.defaultStart,
    endTime: config.defaultEnd,
  };
}
