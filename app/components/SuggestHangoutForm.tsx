'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { getPupColor } from '@/lib/colorUtils';

type Pup = {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
  owner: {
    name: string;
  };
};

type SuggestHangoutFormProps = {
  pups: Pup[];
};

export default function SuggestHangoutForm({ pups }: SuggestHangoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [pupId, setPupId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [friendComment, setFriendComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startAt = new Date(`${startDate}T${startTime}`).toISOString();
      const endAt = new Date(`${endDate}T${endTime}`).toISOString();

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupId,
          startAt,
          endAt,
          friendComment: friendComment || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create suggestion');
      }

      // Success! Redirect to calendar
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Set default dates (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = format(tomorrow, 'yyyy-MM-dd');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Select Pup - Pill Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Which pup would you like to hang out with? *
        </label>
        <div className="flex flex-wrap gap-2">
          {pups.map((pup) => {
            const isSelected = pupId === pup.id;
            const pupColor = getPupColor(pup.id);

            return (
              <button
                key={pup.id}
                type="button"
                onClick={() => setPupId(pup.id)}
                style={{
                  backgroundColor: isSelected ? pupColor : 'transparent',
                  borderColor: pupColor,
                  color: isSelected ? '#FFFFFF' : pupColor,
                }}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all flex items-center gap-2 ${
                  isSelected ? 'shadow-md' : 'hover:shadow-sm'
                }`}
              >
                {pup.profilePhotoUrl && (
                  <Image
                    src={pup.profilePhotoUrl}
                    alt={pup.name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                )}
                {pup.name}
                <span className="text-xs opacity-75">({pup.owner.name})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            min={defaultDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
            Start Time *
          </label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* End Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate || defaultDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Friend Comment */}
      <div>
        <label htmlFor="friendComment" className="block text-sm font-medium text-gray-700 mb-2">
          Why are you available? (optional)
        </label>
        <textarea
          id="friendComment"
          value={friendComment}
          onChange={(e) => setFriendComment(e.target.value)}
          rows={3}
          placeholder="E.g., I have the day off, I'm working from home, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Suggesting...' : 'Suggest This Time'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/calendar')}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
