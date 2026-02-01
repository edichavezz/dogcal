'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Avatar from './Avatar';
import { Trash2 } from 'lucide-react';

type Suggestion = {
  id: string;
  startAt: string;
  endAt: string;
  friendComment?: string | null;
  pup: {
    name: string;
    profilePhotoUrl?: string | null;
  };
  suggestedByFriend: {
    name: string;
  };
};

type SuggestionCardProps = {
  suggestion: Suggestion;
  onDecision: () => void;
};

export default function SuggestionCard({ suggestion, onDecision }: SuggestionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [ownerComment, setOwnerComment] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          ownerComment: ownerComment || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process decision');
      }

      onDecision();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this suggestion? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete suggestion');
      }

      onDecision();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              photoUrl={suggestion.pup.profilePhotoUrl}
              name={suggestion.pup.name}
              size="md"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {suggestion.pup.name}
              </h3>
              <p className="text-sm text-gray-600">
                Suggested by: <strong>{suggestion.suggestedByFriend.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={loading || deleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete suggestion"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Time */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-700">
            <strong>Start:</strong> {format(new Date(suggestion.startAt), 'MMM d, yyyy h:mm a')}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>End:</strong> {format(new Date(suggestion.endAt), 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        {/* Friend Comment */}
        {suggestion.friendComment && (
          <div className="bg-gradient-to-br from-[#ffd4d4]/30 to-[#ffe4d4]/30 border border-[#f4a9a8]/20 p-4 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Friend&apos;s Note:</p>
            <p className="text-gray-800">{suggestion.friendComment}</p>
          </div>
        )}

        {/* Owner Comment Input (optional) */}
        {showCommentInput && (
          <div>
            <label htmlFor={`comment-${suggestion.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              Add a comment (optional):
            </label>
            <textarea
              id={`comment-${suggestion.id}`}
              value={ownerComment}
              onChange={(e) => setOwnerComment(e.target.value)}
              rows={2}
              placeholder="E.g., Thanks! or Sorry, we already have plans..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!showCommentInput && (
            <button
              onClick={() => setShowCommentInput(true)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Add Comment
            </button>
          )}
          <button
            onClick={() => handleDecision('APPROVE')}
            disabled={loading || deleting}
            className="flex-1 px-6 py-2 bg-[#1a3a3a] text-white font-medium rounded-xl hover:bg-[#2a4a4a] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecision('REJECT')}
            disabled={loading || deleting}
            className="flex-1 px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
