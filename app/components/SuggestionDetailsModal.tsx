'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Avatar from './Avatar';
import { X, Trash2 } from 'lucide-react';

type SuggestionForModal = {
  id: string;
  startAt: Date;
  endAt: Date;
  friendComment?: string | null;
  pup: {
    name: string;
    profilePhotoUrl?: string | null;
  };
  suggestedByFriend: {
    id: string;
    name: string;
  };
};

type SuggestionDetailsModalProps = {
  suggestion: SuggestionForModal;
  actingUserId: string;
  onClose: () => void;
  onUpdate: () => void;
};

export default function SuggestionDetailsModal({
  suggestion,
  actingUserId,
  onClose,
  onUpdate,
}: SuggestionDetailsModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isSubmitter = actingUserId === suggestion.suggestedByFriend.id;
  const startDate = new Date(suggestion.startAt);
  const endDate = new Date(suggestion.endAt);
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  const handleWithdraw = async () => {
    if (!confirm('Withdraw this suggestion?')) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to withdraw suggestion');
      }
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Pending suggestion</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Awaiting approval
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Pup info */}
          <div className="flex items-center gap-3">
            <Avatar
              photoUrl={suggestion.pup.profilePhotoUrl}
              name={suggestion.pup.name}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900">{suggestion.pup.name}</p>
              <p className="text-sm text-gray-500">
                Suggested by <strong>{suggestion.suggestedByFriend.name}</strong>
              </p>
            </div>
          </div>

          {/* Date/time */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-sm text-gray-700">
              <strong>Start:</strong>{' '}
              {format(startDate, 'EEE, MMM d, yyyy · h:mm a')}
            </p>
            <p className="text-sm text-gray-700">
              <strong>End:</strong>{' '}
              {format(endDate, isSameDay ? 'h:mm a' : 'EEE, MMM d, yyyy · h:mm a')}
            </p>
          </div>

          {/* Comment */}
          {suggestion.friendComment && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Note</p>
              <p className="text-sm text-gray-800 italic">&ldquo;{suggestion.friendComment}&rdquo;</p>
            </div>
          )}

          {/* Withdraw button — only for the person who submitted */}
          {isSubmitter && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleWithdraw}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Withdrawing...' : 'Withdraw suggestion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
