'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { getPupColor } from '@/lib/colorUtils';
import type { NotificationResult } from '@/lib/whatsapp';
import { buildGenericMessage } from '@/lib/whatsapp-client';
import NotificationResultModal from './NotificationResultModal';
import TimePeriodPicker, { type TimePeriod } from './forms/TimePeriodPicker';

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

// Fun activity placeholders
const generatePlaceholder = () => {
  const timesOfDay = ['Morning', 'Afternoon', 'Evening', 'Nighttime', 'Full Day'];
  const activities = ['Hangout', 'Walk', 'Playtime', 'Cuddles', 'Adventure', 'Park Visit', 'Fetch Session'];

  const time = timesOfDay[Math.floor(Math.random() * timesOfDay.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];

  return `${time} ${activity}`;
};

export default function CreateHangoutForm({ pups, friends }: CreateHangoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationResults, setNotificationResults] = useState<NotificationResult[] | null>(null);
  const [genericMessage, setGenericMessage] = useState<string | null>(null);

  // Get current date
  const now = new Date();

  // Form state with smart defaults
  const [pupId, setPupId] = useState(pups.length === 1 ? pups[0].id : ''); // Pre-select if only one pup
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd')); // Today
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd')); // Same as start date
  const [endTime, setEndTime] = useState('12:00');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('morning');
  const [ownerNotes, setOwnerNotes] = useState('');
  const [eventName, setEventName] = useState('');
  const [assignedFriendUserId, setAssignedFriendUserId] = useState('');
  const [placeholder] = useState(generatePlaceholder());
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [repeatCount, setRepeatCount] = useState(4);

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
          repeatEnabled: repeatEnabled || undefined,
          repeatFrequency: repeatEnabled ? repeatFrequency : undefined,
          repeatCount: repeatEnabled ? repeatCount : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create hangout');
      }

      const data = await response.json();

      // Show notification results if available
      if (data.notifications && data.notifications.length > 0) {
        const pupName = pups.find(p => p.id === pupId)?.name ?? 'the pup';
        setGenericMessage(buildGenericMessage({
          pupName,
          startAt: new Date(`${startDate}T${startTime}`),
          endAt: new Date(`${endDate}T${endTime}`),
          eventName: eventName || null,
        }));
        setNotificationResults(data.notifications);
      } else {
        // No notifications to show, redirect immediately
        router.push('/calendar');
      }
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

      {/* Start & End Date */}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />
        </div>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] cursor-pointer"
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />
        </div>
      </div>

      {/* Time Period */}
      <TimePeriodPicker
        period={timePeriod}
        startTime={startTime}
        endTime={endTime}
        onPeriodChange={setTimePeriod}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
      />

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
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
        >
          <option value="">Leave open for any friend...</option>
          {friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.name}
            </option>
          ))}
        </select>
      </div>

      {/* Repeat Options */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="repeatEnabled"
            checked={repeatEnabled}
            onChange={(e) => setRepeatEnabled(e.target.checked)}
            className="w-4 h-4 text-yellow-400 focus:ring-[#f4a9a8] border-gray-300 rounded"
          />
          <label htmlFor="repeatEnabled" className="text-sm font-medium text-gray-700">
            Repeat this hangout
          </label>
        </div>

        {repeatEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label htmlFor="repeatFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                id="repeatFrequency"
                value={repeatFrequency}
                onChange={(e) => setRepeatFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label htmlFor="repeatCount" className="block text-sm font-medium text-gray-700 mb-2">
                Number of occurrences
              </label>
              <input
                type="number"
                id="repeatCount"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Math.max(2, Math.min(52, parseInt(e.target.value) || 2)))}
                min="2"
                max="52"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#f4a9a8] text-[#1a3a3a] font-medium rounded-xl hover:bg-[#f5b9b8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Creating...' : 'Create Hangout'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/calendar')}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>

      {notificationResults && (
        <NotificationResultModal
          results={notificationResults}
          title={`Letting ${pups.find(p => p.id === pupId)?.name ?? 'the pup'}'s friends know!`}
          genericMessage={genericMessage ?? undefined}
          onClose={() => {
            setNotificationResults(null);
            setGenericMessage(null);
            router.push('/calendar');
          }}
        />
      )}
    </form>
  );
}
