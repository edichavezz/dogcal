'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Avatar from '../Avatar';
import { getEventGradient } from '@/lib/colorUtils';

export type HangoutCardData = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  eventName: string | null;
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

export default function HangoutListCard({ hangout, onClick }: HangoutListCardProps) {
  const startDate = new Date(hangout.startAt);
  const endDate = new Date(hangout.endAt);
  const isOpen = hangout.status === 'OPEN';

  // Get deterministic color based on assigned friend or pup
  const colorId = hangout.assignedFriend?.id || hangout.pup.id;
  const gradient = getEventGradient(colorId);

  // Format date/time display
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const dateDisplay = format(startDate, 'EEE, MMM d');
  const timeDisplay = isSameDay
    ? `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
    : `${format(startDate, 'h:mm a')} - ${format(endDate, 'EEE h:mm a')}`;

  // Generate display title
  const displayTitle = hangout.eventName ||
    `${hangout.pup.name}${hangout.assignedFriend ? ` with ${hangout.assignedFriend.name}` : ''}`;

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
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {hangout.pup.profilePhotoUrl ? (
            <Image
              src={hangout.pup.profilePhotoUrl}
              alt={hangout.pup.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              🐕
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {displayTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            {dateDisplay} &middot; {timeDisplay}
          </p>
        </div>

        {/* Status Badge / Friend Avatar */}
        <div className="flex-shrink-0">
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
