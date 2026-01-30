'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import Avatar from '../Avatar';

export type SuggestionCardData = {
  id: string;
  startAt: string;
  endAt: string;
  eventName: string | null;
  friendComment?: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
  suggestedByFriend: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
};

type SuggestionPreviewCardProps = {
  suggestion: SuggestionCardData;
  showFriend?: boolean; // Show who suggested (for owners)
};

export default function SuggestionPreviewCard({
  suggestion,
  showFriend = true,
}: SuggestionPreviewCardProps) {
  const startDate = new Date(suggestion.startAt);
  const endDate = new Date(suggestion.endAt);

  // Format date/time display
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const dateDisplay = format(startDate, 'EEE, MMM d');
  const timeDisplay = isSameDay
    ? `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
    : `${format(startDate, 'h:mm a')} - ${format(endDate, 'EEE h:mm a')}`;

  return (
    <Link
      href="/approvals"
      className="block w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-dotted border-blue-300 transition-all hover:shadow-lg hover:border-blue-400"
    >
      <div className="flex items-center gap-3">
        {/* Pup Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {suggestion.pup.profilePhotoUrl ? (
            <Image
              src={suggestion.pup.profilePhotoUrl}
              alt={suggestion.pup.name}
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
              {suggestion.eventName || suggestion.pup.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            {dateDisplay} &middot; {timeDisplay}
          </p>
          {suggestion.friendComment && (
            <p className="text-xs text-gray-500 mt-1 truncate italic">
              &ldquo;{suggestion.friendComment}&rdquo;
            </p>
          )}
        </div>

        {/* Friend Avatar (who suggested) */}
        {showFriend && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <Avatar
              photoUrl={suggestion.suggestedByFriend.profilePhotoUrl}
              name={suggestion.suggestedByFriend.name}
              size="sm"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
