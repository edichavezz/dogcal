'use client';

import { memo } from 'react';
import { CalendarEvent } from './CalendarContext';
import Avatar from '../Avatar';
import { getFriendColor } from '@/lib/colorUtils';

type EventPillProps = {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
};

function EventPill({ event, onClick, compact = false }: EventPillProps) {
  const isOpen = event.status === 'OPEN';
  const isPending = event.status === 'PENDING';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        event-pill w-full text-left flex items-center gap-1
        ${event.colorClass}
        ${isOpen ? 'opacity-60 border-dashed' : ''}
        ${isPending ? 'opacity-50 border-dotted' : ''}
        border-l-2
      `}
      style={{ borderLeftWidth: '3px' }}
    >
      {/* Dual avatars: pup + friend (v1's rich display) */}
      {!compact && (
        <div className="flex items-center flex-shrink-0">
          <Avatar
            name={event.pupName}
            photoUrl={event.pupPhotoUrl}
            size="xs"
          />
          {event.assignedFriendId && (
            <Avatar
              name={event.assignedFriendName!}
              photoUrl={event.assignedFriendPhotoUrl}
              size="xs"
              className="-ml-2"
              style={{ border: `2px solid ${getFriendColor(event.assignedFriendId)}` }}
            />
          )}
        </div>
      )}
      <span className="truncate flex-1 text-slate-700 font-medium">
        {compact ? event.pupName.charAt(0) : event.title}
      </span>
      {/* Recurring indicator */}
      {event.isRecurring && !compact && (
        <span className="text-[10px]">🔄</span>
      )}
      {isOpen && !compact && (
        <span className="text-[10px] text-slate-500 flex-shrink-0">Open</span>
      )}
    </button>
  );
}

export default memo(EventPill);
