'use client';

import { format, isToday, isTomorrow, isThisWeek, isNextWeek, startOfWeek, addWeeks, differenceInDays } from 'date-fns';
import Avatar from '../Avatar';
import { getEventGradient } from '@/lib/colorUtils';
import { Repeat } from 'lucide-react';

export type HangoutCardData = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  eventName: string | null;
  seriesId?: string | null;
  seriesIndex?: number | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
  assignedFriend?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  } | null;
};

type HangoutListCardProps = {
  hangout: HangoutCardData;
  onClick: () => void;
};

// Format date in relative terms
function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  const now = new Date();
  const daysDiff = differenceInDays(date, now);

  // Within this week (use day name)
  if (isThisWeek(date, { weekStartsOn: 1 }) && daysDiff <= 6) {
    return format(date, 'EEEE'); // "Monday", "Tuesday", etc.
  }

  // Next week (use "Next Monday", etc.)
  if (isNextWeek(date, { weekStartsOn: 1 })) {
    return `Next ${format(date, 'EEEE')}`;
  }

  // Further out - show full date
  return format(date, 'EEE, MMM d');
}

export default function HangoutListCard({ hangout, onClick }: HangoutListCardProps) {
  const startDate = new Date(hangout.startAt);
  const endDate = new Date(hangout.endAt);
  const isOpen = hangout.status === 'OPEN';
  const isRecurring = !!hangout.seriesId;

  // Get deterministic color based on assigned friend or pup
  const colorId = hangout.assignedFriend?.id || hangout.pup.id;
  const gradient = getEventGradient(colorId);

  // Format date/time display
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const dateDisplay = formatRelativeDate(startDate);
  const timeDisplay = isSameDay
    ? `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
    : `${format(startDate, 'h:mm a')} - ${format(endDate, 'EEE h:mm a')}`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 transition-all hover:shadow-lg ${
        isOpen
          ? 'border-dashed border-amber-300 hover:border-amber-400'
          : 'border-solid hover:border-gray-300'
      }`}
      style={{
        borderColor: isOpen ? undefined : gradient.border,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Pup Avatar */}
        <Avatar
          photoUrl={hangout.pup.profilePhotoUrl}
          name={hangout.pup.name}
          size="md"
          className="flex-shrink-0"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Pup name and friend name */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              {hangout.pup.name}
            </h3>
            {hangout.assignedFriend && (
              <>
                <span className="text-gray-400 text-sm">with</span>
                <span className="font-medium text-gray-700 text-sm sm:text-base">
                  {hangout.assignedFriend.name}
                </span>
              </>
            )}
            {isRecurring && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Repeat className="w-3 h-3" />
                <span className="hidden sm:inline">Repeats weekly</span>
              </span>
            )}
          </div>

          {/* Event name if different from default */}
          {hangout.eventName && (
            <p className="text-xs text-gray-500 truncate mb-0.5">
              {hangout.eventName}
            </p>
          )}

          {/* Date and time */}
          <p className="text-xs sm:text-sm text-gray-600">
            {dateDisplay} &middot; {timeDisplay}
          </p>
        </div>

        {/* Status Badge / Friend Avatar */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isOpen ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-dashed border-amber-300">
              Open
            </span>
          ) : hangout.assignedFriend ? (
            <Avatar
              photoUrl={hangout.assignedFriend.profilePhotoUrl}
              name={hangout.assignedFriend.name}
              size="sm"
            />
          ) : null}
        </div>
      </div>
    </button>
  );
}
