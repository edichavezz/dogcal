'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Avatar from './Avatar';

type Hangout = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  ownerNotes?: string | null;
  eventName: string | null;
  pup: {
    id: string;
    name: string;
    careInstructions?: string | null;
    profilePhotoUrl?: string | null;
    owner: {
      id: string;
      name: string;
    };
  };
  assignedFriend?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  } | null;
  notes: Array<{
    id: string;
    noteText: string;
    createdAt: string;
    author: {
      name: string;
    };
  }>;
};

type EventDetailsModalProps = {
  hangout: Hangout;
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
  onClose: () => void;
  onUpdate: () => void;
};

export default function EventDetailsModal({
  hangout,
  actingUserId,
  actingUserRole,
  onClose,
  onUpdate,
}: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedEventName, setEditedEventName] = useState(hangout.eventName || '');
  const [isEditingFull, setIsEditingFull] = useState(false);
  const [editedStartDate, setEditedStartDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndDate, setEditedEndDate] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedOwnerNotes, setEditedOwnerNotes] = useState(hangout.ownerNotes || '');
  const [editedAssignedFriend, setEditedAssignedFriend] = useState(hangout.assignedFriend?.id || '');
  const [friends, setFriends] = useState<Array<{ id: string; name: string }>>([]);

  const isAssignedToMe = hangout.assignedFriend?.id === actingUserId;
  const isOwner = actingUserRole === 'OWNER' && hangout.pup.owner.id === actingUserId;
  const canAssign = actingUserRole === 'FRIEND' && hangout.status === 'OPEN';
  const canUnassign = actingUserRole === 'FRIEND' && isAssignedToMe;

  // Generate display title
  const displayTitle = hangout.eventName ||
    `${hangout.pup.name}${
      hangout.assignedFriend ? ` - ${hangout.assignedFriend.name}` : ' (Open)'
    }`;

  const handleAssign = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/hangouts/${hangout.id}/assign`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign');
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Are you sure you want to unassign yourself from this hangout?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/hangouts/${hangout.id}/unassign`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unassign');
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    setError('');

    try {
      const response = await fetch(`/api/hangouts/${hangout.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add note');
      }

      setNoteText('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleSaveEventName = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/hangouts/${hangout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: editedEventName || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update event name');
      }

      setIsEditingName(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditName = () => {
    setEditedEventName(hangout.eventName || '');
    setIsEditingName(false);
  };

  const handleStartFullEdit = async () => {
    // Initialize form with current values
    const startDate = new Date(hangout.startAt);
    const endDate = new Date(hangout.endAt);
    setEditedStartDate(format(startDate, 'yyyy-MM-dd'));
    setEditedStartTime(format(startDate, 'HH:mm'));
    setEditedEndDate(format(endDate, 'yyyy-MM-dd'));
    setEditedEndTime(format(endDate, 'HH:mm'));
    setEditedEventName(hangout.eventName || '');
    setEditedOwnerNotes(hangout.ownerNotes || '');
    setEditedAssignedFriend(hangout.assignedFriend?.id || '');

    // Fetch friends for the pup if owner is editing
    if (isOwner) {
      try {
        const response = await fetch(`/api/pups/${hangout.pup.id}`);
        const data = await response.json();
        if (data.pup?.friendships) {
          setFriends(data.pup.friendships.map((f: any) => ({ id: f.friend.id, name: f.friend.name })));
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    }

    setIsEditingFull(true);
  };

  const handleSaveFullEdit = async () => {
    setLoading(true);
    setError('');

    try {
      const startAt = new Date(`${editedStartDate}T${editedStartTime}`).toISOString();
      const endAt = new Date(`${editedEndDate}T${editedEndTime}`).toISOString();

      const updates: any = {
        startAt,
        endAt,
      };

      if (isOwner) {
        updates.eventName = editedEventName || null;
        updates.ownerNotes = editedOwnerNotes || null;
        updates.assignedFriendUserId = editedAssignedFriend || null;
      }

      const response = await fetch(`/api/hangouts/${hangout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update hangout');
      }

      setIsEditingFull(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFullEdit = () => {
    setIsEditingFull(false);
    setError('');
  };

  const canEdit = isOwner || isAssignedToMe;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedEventName}
                    onChange={(e) => setEditedEventName(e.target.value)}
                    maxLength={100}
                    placeholder={`${hangout.pup.name}${
                      hangout.assignedFriend ? ` - ${hangout.assignedFriend.name}` : ' (Open)'
                    }`}
                    className="w-full text-2xl font-bold px-3 py-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEventName}
                      disabled={loading}
                      className="px-4 py-1 bg-[#f4a9a8] text-[#1a3a3a] text-sm font-medium rounded-xl hover:bg-[#f5b9b8] disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      disabled={loading}
                      className="px-4 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {displayTitle}
                    </h2>
                    {isOwner && !isEditingFull && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        title="Edit event name"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Avatar
                      photoUrl={hangout.pup.profilePhotoUrl}
                      name={hangout.pup.name}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {hangout.pup.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Owner: {hangout.pup.owner.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Edit Mode */}
          {isEditingFull ? (
            <div className="space-y-4">
              {/* Event Name - Owner only */}
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name (optional)
                  </label>
                  <input
                    type="text"
                    value={editedEventName}
                    onChange={(e) => setEditedEventName(e.target.value)}
                    maxLength={100}
                    placeholder={`${hangout.pup.name}${hangout.assignedFriend ? ` - ${hangout.assignedFriend.name}` : ' (Open)'}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={editedStartDate}
                    onChange={(e) => setEditedStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={editedStartTime}
                    onChange={(e) => setEditedStartTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={editedEndDate}
                    onChange={(e) => setEditedEndDate(e.target.value)}
                    required
                    min={editedStartDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={editedEndTime}
                    onChange={(e) => setEditedEndTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
              </div>

              {/* Owner Notes - Owner only */}
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Care Instructions / Notes
                  </label>
                  <textarea
                    value={editedOwnerNotes}
                    onChange={(e) => setEditedOwnerNotes(e.target.value)}
                    rows={4}
                    placeholder="E.g., Feed at noon, needs medication, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
              )}

              {/* Assign to Friend - Owner only */}
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Friend (optional)
                  </label>
                  <select
                    value={editedAssignedFriend}
                    onChange={(e) => setEditedAssignedFriend(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  >
                    <option value="">Leave open for any friend...</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Edit Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveFullEdit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#f4a9a8] text-[#1a3a3a] font-medium rounded-xl hover:bg-[#f5b9b8] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelFullEdit}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Date & Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Date & time</h3>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-800">
                    <strong>Start:</strong> {format(new Date(hangout.startAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-gray-800 mt-1">
                    <strong>End:</strong> {format(new Date(hangout.endAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                hangout.status === 'OPEN'
                  ? 'bg-[#ffd4d4] text-[#1a3a3a]'
                  : hangout.status === 'ASSIGNED'
                  ? 'bg-[#1a3a3a] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {hangout.status}
            </span>
            {hangout.assignedFriend && (
              <div className="flex items-center gap-2 mt-3">
                <Avatar
                  photoUrl={hangout.assignedFriend.profilePhotoUrl}
                  name={hangout.assignedFriend.name}
                  size="sm"
                />
                <div>
                  <p className="text-sm text-gray-600">Assigned to:</p>
                  <p className="text-sm font-semibold text-gray-900">{hangout.assignedFriend.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Owner Notes */}
          {hangout.ownerNotes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Care instructions from owner
              </h3>
              <div className="bg-gradient-to-br from-[#ffd4d4]/30 to-[#ffe4d4]/30 border border-[#f4a9a8]/20 p-4 rounded-xl">
                <p className="text-gray-800 whitespace-pre-wrap">{hangout.ownerNotes}</p>
              </div>
            </div>
          )}

          {/* Pup Care Instructions */}
          {hangout.pup.careInstructions && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                General care instructions for {hangout.pup.name}
              </h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {hangout.pup.careInstructions}
                </p>
              </div>
            </div>
          )}

          {/* Notes Thread */}
          {hangout.notes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
              <div className="space-y-3">
                {hangout.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {note.author.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-700">{note.noteText}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim() || submittingNote}
                    className="px-6 py-2 bg-[#f4a9a8] text-[#1a3a3a] font-medium rounded-xl hover:bg-[#f5b9b8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

              {/* Action Buttons */}
              {!isEditingFull && (
                <div className="flex gap-3 pt-4">
                  {canEdit && (
                    <button
                      onClick={handleStartFullEdit}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-[#1a3a3a] text-white font-medium rounded-xl hover:bg-[#2a4a4a] disabled:opacity-50 transition-all"
                    >
                      Edit Hangout
                    </button>
                  )}
                  {canAssign && (
                    <button
                      onClick={handleAssign}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-[#f4a9a8] text-[#1a3a3a] font-medium rounded-xl hover:bg-[#f5b9b8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? 'Assigning...' : "I'll take this!"}
                    </button>
                  )}
                  {canUnassign && (
                    <button
                      onClick={handleUnassign}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? 'Unassigning...' : 'Unassign Myself'}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
