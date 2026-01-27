'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format, addHours } from 'date-fns';
import { getPupColor } from '@/lib/colorUtils';

type Pup = {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
  careInstructions?: string | null;
};

type Friend = {
  id: string;
  name: string;
};

type CreateHangoutFormProps = {
  pups: Pup[];
  friends: Friend[];
};

export default function CreateHangoutForm({ pups, friends }: CreateHangoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current time and smart defaults
  const now = new Date();
  const roundedNow = new Date(now);
  roundedNow.setMinutes(0, 0, 0); // Round to current hour
  const fourHoursLater = addHours(roundedNow, 4);

  // Form state with smart defaults
  const [pupId, setPupId] = useState(pups.length === 1 ? pups[0].id : ''); // Pre-select if only one pup
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd')); // Today
  const [startTime, setStartTime] = useState(format(roundedNow, 'HH:mm')); // Current hour
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd')); // Same as start date
  const [endTime, setEndTime] = useState(format(fourHoursLater, 'HH:mm')); // 4 hours later
  const [ownerNotes, setOwnerNotes] = useState('');
  const [eventName, setEventName] = useState('');
  const [assignedFriendUserId, setAssignedFriendUserId] = useState('');

  // Auto-sync end date with start date
  useEffect(() => {
    if (startDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  // Auto-update end time when start time changes (maintain 4-hour duration)
  useEffect(() => {
    if (startTime && startDate === endDate) {
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDateTime = new Date();
        startDateTime.setHours(hours, minutes, 0, 0);
        const endDateTime = addHours(startDateTime, 4);
        setEndTime(format(endDateTime, 'HH:mm'));
      } catch {
        // If parsing fails, keep existing end time
      }
    }
  }, [startTime, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startAt = new Date(`${startDate}T${startTime}`).toISOString();
      const endAt = new Date(`${endDate}T${endTime}`).toISOString();

      const response = await fetch('/api/hangouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupId,
          startAt,
          endAt,
          ownerNotes: ownerNotes || undefined,
          eventName: eventName || undefined,
          assignedFriendUserId: assignedFriendUserId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create hangout');
      }

      // Success! Redirect to calendar
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const today = format(now, 'yyyy-MM-dd');

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
          Which pup? *
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
            min={today}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />
        </div>
      </div>

      {/* End Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date * {startDate !== endDate && <span className="text-xs text-gray-500">(multi-day)</span>}
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate || today}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />
        </div>
      </div>

      {/* Event Name */}
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name (optional)
        </label>
        <input
          type="text"
          id="eventName"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          maxLength={100}
          placeholder="E.g., Morning Walk, Vet Visit, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {pupId && (
          <p className="mt-2 text-sm text-gray-600">
            Calendar will show: <span className="font-medium">
              {eventName || `${pups.find(p => p.id === pupId)?.name}${
                assignedFriendUserId
                  ? ` - ${friends.find(f => f.id === assignedFriendUserId)?.name}`
                  : ' (Open)'
              }`}
            </span>
          </p>
        )}
      </div>

      {/* Owner Notes */}
      <div>
        <label htmlFor="ownerNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Care Instructions / Notes
        </label>
        <textarea
          id="ownerNotes"
          value={ownerNotes}
          onChange={(e) => setOwnerNotes(e.target.value)}
          rows={4}
          placeholder="E.g., Feed at noon, needs medication, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Assign to Friend (optional) */}
      <div>
        <label htmlFor="assignedFriend" className="block text-sm font-medium text-gray-700 mb-2">
          Assign to Friend (optional)
        </label>
        <select
          id="assignedFriend"
          value={assignedFriendUserId}
          onChange={(e) => setAssignedFriendUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">Leave open for any friend...</option>
          {friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Creating...' : 'Create Hangout'}
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
