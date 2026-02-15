'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X, Clock, User } from 'lucide-react';
import { CalendarEvent, useCalendar } from './CalendarContext';
import Avatar from '../Avatar';

type EventSheetProps = {
  onViewDetails?: (event: CalendarEvent) => void;
  currentUserId?: string;
};

export default function EventSheet({
  onViewDetails,
  currentUserId,
}: EventSheetProps) {
  const { selectedEvent, isSheetOpen, closeSheet } = useCalendar();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle backdrop click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        closeSheet();
      }
    };

    if (isSheetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isSheetOpen, closeSheet]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSheet();
      }
    };

    if (isSheetOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSheetOpen, closeSheet]);

  if (!selectedEvent) return null;

  const isHangout = selectedEvent.type === 'hangout';
  const isOpen = selectedEvent.status === 'OPEN';
  const isAssigned = selectedEvent.status === 'ASSIGNED';
  const isPending = selectedEvent.status === 'PENDING';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/30 z-40
          transition-opacity duration-300
          ${isSheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isSheetOpen ? 'open' : ''}`}
      >
        {/* Handle */}
        <div className="bottom-sheet-handle" />

        {/* Close button */}
        <button
          onClick={closeSheet}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Content */}
        <div className="px-4 pb-6 pt-2 safe-bottom">
          {/* Header with dual avatars */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center">
              <Avatar
                name={selectedEvent.pupName}
                photoUrl={selectedEvent.pupPhotoUrl}
                size="lg"
              />
              {selectedEvent.assignedFriendId && (
                <Avatar
                  name={selectedEvent.assignedFriendName!}
                  photoUrl={selectedEvent.assignedFriendPhotoUrl}
                  size="md"
                  className="-ml-4 border-2 border-white"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {selectedEvent.title}
              </h3>
              <p className="text-sm text-slate-500">{selectedEvent.pupName}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span
                  className={`
                    inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${isOpen ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${isAssigned ? 'bg-green-100 text-green-800' : ''}
                    ${isPending ? 'bg-blue-100 text-blue-800' : ''}
                  `}
                >
                  {selectedEvent.status}
                </span>
                {selectedEvent.type === 'suggestion' && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Suggestion
                  </span>
                )}
                {selectedEvent.isRecurring && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    🔄 Recurring
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-medium">
                  {format(selectedEvent.startAt, 'EEEE, MMMM d, yyyy')}
                </p>
                <p>
                  {format(selectedEvent.startAt, 'h:mm a')} -{' '}
                  {format(selectedEvent.endAt, 'h:mm a')}
                </p>
              </div>
            </div>

            {selectedEvent.assignedFriendName && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                <span>
                  Assigned to <strong>{selectedEvent.assignedFriendName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onViewDetails && (
              <button
                onClick={() => {
                  onViewDetails(selectedEvent);
                  closeSheet();
                }}
                className="flex-1 py-3 px-4 bg-[#1a3a3a] text-white rounded-xl font-medium hover:bg-[#2a4a4a] transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
