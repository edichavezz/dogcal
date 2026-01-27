'use client';

import { useState } from 'react';
import { UserRole } from '@prisma/client';
import Image from 'next/image';

type Friend = {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  calendarColor: string | null;
};

type PupWithFriendships = {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  careInstructions: string | null;
  ownerUserId: string;
  friendships: Array<{
    id: string;
    historyWithPup: string | null;
    friend: Friend;
  }>;
};

type PupOwner = {
  id: string;
  name: string;
  addressText: string | null;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
};

type PupFriendship = {
  id: string;
  historyWithPup: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl: string | null;
    careInstructions: string | null;
    ownerUserId: string;
    owner: PupOwner;
  };
};

type User = {
  id: string;
  name: string;
  addressText: string | null;
  phoneNumber: string | null;
  role: UserRole;
  profilePhotoUrl: string | null;
  ownedPups: PupWithFriendships[];
  pupFriendships: PupFriendship[];
};

type Props = {
  user: User;
  allFriends: Friend[];
};

export default function ManageClient({ user, allFriends }: Props) {
  const [userData, setUserData] = useState(user);
  const [editingUser, setEditingUser] = useState(false);
  const [editingPup, setEditingPup] = useState<string | null>(null);
  const [editingFriendship, setEditingFriendship] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // User profile form state
  const [userName, setUserName] = useState(user.name);
  const [userAddress, setUserAddress] = useState(user.addressText || '');
  const [userPhone, setUserPhone] = useState(user.phoneNumber || '');

  // Pup form state
  const [pupName, setPupName] = useState('');
  const [pupInstructions, setPupInstructions] = useState('');

  // Friendship form state
  const [selectedFriend, setSelectedFriend] = useState('');
  const [friendHistory, setFriendHistory] = useState('');

  // New friend form state
  const [showNewFriendForm, setShowNewFriendForm] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendAddress, setNewFriendAddress] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');

  const handlePhotoUpload = async (
    entityType: 'user' | 'pup',
    entityId: string,
    file: File
  ) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to upload photo');
        return;
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          addressText: userAddress || null,
          phoneNumber: userPhone || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update profile');
        return;
      }

      setUserData({ ...userData, name: userName, addressText: userAddress, phoneNumber: userPhone });
      setEditingUser(false);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePup = async (pupId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pups/${pupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pupName,
          careInstructions: pupInstructions || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update pup');
        return;
      }

      const { pup } = await res.json();
      setUserData({
        ...userData,
        ownedPups: userData.ownedPups.map((p) =>
          p.id === pupId ? { ...p, ...pup } : p
        ),
      });
      setEditingPup(null);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update pup');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewFriend = async (pupId: string) => {
    if (!newFriendName.trim()) {
      alert('Please enter a name for the friend');
      return;
    }

    setLoading(true);
    try {
      // First, create the new friend user
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFriendName,
          addressText: newFriendAddress || null,
          phoneNumber: newFriendPhone || null,
        }),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        alert(error.error || 'Failed to create friend');
        return;
      }

      const { user: newFriend } = await createRes.json();

      // Then, create the friendship
      const friendshipRes = await fetch('/api/friendships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupId,
          friendUserId: newFriend.id,
          historyWithPup: friendHistory || null,
        }),
      });

      if (!friendshipRes.ok) {
        const error = await friendshipRes.json();
        alert(error.error || 'Failed to add friendship');
        return;
      }

      // Reset form and refresh
      setNewFriendName('');
      setNewFriendAddress('');
      setNewFriendPhone('');
      setShowNewFriendForm(false);
      window.location.reload();
    } catch (error) {
      console.error('Create friend error:', error);
      alert('Failed to create friend');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (pupId: string) => {
    if (!selectedFriend) return;

    setLoading(true);
    try {
      const res = await fetch('/api/friendships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupId,
          friendUserId: selectedFriend,
          historyWithPup: friendHistory || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to add friend');
        return;
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Add friend error:', error);
      alert('Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFriendship = async (friendshipId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friendships/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyWithPup: friendHistory || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update friendship');
        return;
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Update friendship error:', error);
      alert('Failed to update friendship');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriendship = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/friendships/${friendshipId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to remove friend');
        return;
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Delete friendship error:', error);
      alert('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  if (user.role === 'OWNER') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pups & Friends</h1>
          <p className="text-gray-600">Manage your profile, pups, and friendships</p>
        </div>

        {/* Owner Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Profile</h2>
          <div className="flex items-start gap-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              {userData.profilePhotoUrl ? (
                <Image
                  src={userData.profilePhotoUrl}
                  alt={userData.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-30 h-30 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-3xl font-bold text-amber-700">
                  {userData.name.charAt(0)}
                </div>
              )}
              <label className="mt-3 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg cursor-pointer hover:from-yellow-500 hover:to-orange-500 text-sm font-medium transition-all">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload('user', user.id, file);
                  }}
                />
              </label>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              {editingUser ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateUser}
                      disabled={loading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUser(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</p>
                  {userData.addressText && <p className="text-gray-600 mb-1">📍 {userData.addressText}</p>}
                  {userData.phoneNumber && <p className="text-gray-600 mb-3">📞 {userData.phoneNumber}</p>}
                  <button
                    onClick={() => setEditingUser(true)}
                    className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 font-medium transition-all"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pups Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Pups</h2>
          {userData.ownedPups.length === 0 ? (
            <p className="text-gray-500">No pups yet</p>
          ) : (
            <div className="space-y-8">
              {userData.ownedPups.map((pup) => (
                <div key={pup.id} className="border-b border-gray-200 last:border-b-0 pb-8 last:pb-0">
                  <div className="flex items-start gap-6">
                    {/* Pup Photo */}
                    <div className="flex flex-col items-center">
                      {pup.profilePhotoUrl ? (
                        <Image
                          src={pup.profilePhotoUrl}
                          alt={pup.name}
                          width={100}
                          height={100}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-25 h-25 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-3xl">
                          🐕
                        </div>
                      )}
                      <label className="mt-3 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg cursor-pointer hover:from-yellow-500 hover:to-orange-500 text-xs font-medium transition-all">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload('pup', pup.id, file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Pup Details */}
                    <div className="flex-1">
                      {editingPup === pup.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={pupName}
                              onChange={(e) => setPupName(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Care Instructions
                              <span className="block text-xs text-gray-500 font-normal mt-1">
                                Share details about your pup&apos;s routine: walk schedules, feeding times, favorite treats,
                                how many poos are normal, play preferences, known tricks, training tips, special needs, etc.
                              </span>
                            </label>
                            <textarea
                              value={pupInstructions}
                              onChange={(e) => setPupInstructions(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              placeholder="e.g., Walks at 8am and 6pm, eats 2 cups of kibble twice daily, loves fetch, knows sit/stay/down, usually poos 2x per day..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdatePup(pup.id)}
                              disabled={loading}
                              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPup(null)}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{pup.name}</h3>
                          {pup.careInstructions && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">Care Instructions:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{pup.careInstructions}</p>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setEditingPup(pup.id);
                              setPupName(pup.name);
                              setPupInstructions(pup.careInstructions || '');
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 font-medium transition-all"
                          >
                            Edit Pup
                          </button>

                          {/* Friends for this pup */}
                          <div className="mt-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Friends with {pup.name}</h4>
                            {pup.friendships.length === 0 ? (
                              <p className="text-gray-500 text-sm mb-4">No friends yet</p>
                            ) : (
                              <div className="space-y-3 mb-4">
                                {pup.friendships.map((friendship) => (
                                  <div key={friendship.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                      {friendship.friend.profilePhotoUrl ? (
                                        <Image
                                          src={friendship.friend.profilePhotoUrl}
                                          alt={friendship.friend.name}
                                          width={40}
                                          height={40}
                                          className="rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                                          {friendship.friend.name.charAt(0)}
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{friendship.friend.name}</p>
                                        {editingFriendship === friendship.id ? (
                                          <div className="mt-2 space-y-2">
                                            <textarea
                                              value={friendHistory}
                                              onChange={(e) => setFriendHistory(e.target.value)}
                                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                              placeholder="History with this pup..."
                                            />
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleUpdateFriendship(friendship.id)}
                                                disabled={loading}
                                                className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 font-medium transition-colors"
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={() => setEditingFriendship(null)}
                                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 font-medium transition-colors"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {friendship.historyWithPup && (
                                              <p className="text-sm text-gray-600 mt-1">{friendship.historyWithPup}</p>
                                            )}
                                            <div className="flex gap-3 mt-2">
                                              <button
                                                onClick={() => {
                                                  setEditingFriendship(friendship.id);
                                                  setFriendHistory(friendship.historyWithPup || '');
                                                }}
                                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => handleDeleteFriendship(friendship.id)}
                                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Friend Button */}
                            {showAddFriend === pup.id ? (
                              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                <div className="flex gap-2 mb-4">
                                  <button
                                    onClick={() => setShowNewFriendForm(false)}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                      !showNewFriendForm
                                        ? 'bg-amber-100 text-amber-900 border-2 border-amber-500'
                                        : 'bg-white text-gray-700 border border-gray-300'
                                    }`}
                                  >
                                    Select Existing
                                  </button>
                                  <button
                                    onClick={() => setShowNewFriendForm(true)}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                      showNewFriendForm
                                        ? 'bg-amber-100 text-amber-900 border-2 border-amber-500'
                                        : 'bg-white text-gray-700 border border-gray-300'
                                    }`}
                                  >
                                    Create New
                                  </button>
                                </div>

                                {showNewFriendForm ? (
                                  <div className="space-y-3">
                                    <h5 className="font-semibold text-gray-800">Create New Friend</h5>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                      <input
                                        type="text"
                                        value={newFriendName}
                                        onChange={(e) => setNewFriendName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="Friend's name"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
                                      <input
                                        type="text"
                                        value={newFriendAddress}
                                        onChange={(e) => setNewFriendAddress(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="Friend's address"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                                      <input
                                        type="tel"
                                        value={newFriendPhone}
                                        onChange={(e) => setNewFriendPhone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="Friend's phone"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">History with pup (optional)</label>
                                      <textarea
                                        value={friendHistory}
                                        onChange={(e) => setFriendHistory(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="History with this pup..."
                                      />
                                    </div>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleCreateNewFriend(pup.id)}
                                        disabled={loading || !newFriendName.trim()}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                                      >
                                        Create & Add Friend
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowAddFriend(null);
                                          setShowNewFriendForm(false);
                                          setNewFriendName('');
                                          setNewFriendAddress('');
                                          setNewFriendPhone('');
                                          setSelectedFriend('');
                                          setFriendHistory('');
                                        }}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <h5 className="font-semibold text-gray-800">Select Existing Friend</h5>
                                    <select
                                      value={selectedFriend}
                                      onChange={(e) => setSelectedFriend(e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    >
                                      <option value="">Select a friend...</option>
                                      {allFriends
                                        .filter((f) => !pup.friendships.some((fs) => fs.friend.id === f.id))
                                        .map((friend) => (
                                          <option key={friend.id} value={friend.id}>
                                            {friend.name}
                                          </option>
                                        ))}
                                    </select>
                                    <textarea
                                      value={friendHistory}
                                      onChange={(e) => setFriendHistory(e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                      placeholder="History with this pup (optional)..."
                                    />
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleAddFriend(pup.id)}
                                        disabled={loading || !selectedFriend}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                                      >
                                        Add Friend
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowAddFriend(null);
                                          setSelectedFriend('');
                                          setFriendHistory('');
                                        }}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddFriend(pup.id)}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                              >
                                + Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // FRIEND VIEW
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pups</h1>
        <p className="text-gray-600">Manage your profile and the pups you care for</p>
      </div>

      {/* Friend Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Profile</h2>
        <div className="flex items-start gap-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            {userData.profilePhotoUrl ? (
              <Image
                src={userData.profilePhotoUrl}
                alt={userData.name}
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-30 h-30 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-3xl font-bold text-amber-700">
                {userData.name.charAt(0)}
              </div>
            )}
            <label className="mt-3 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg cursor-pointer hover:from-yellow-500 hover:to-orange-500 text-sm font-medium transition-all">
              Change Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload('user', user.id, file);
                }}
              />
            </label>
          </div>

          {/* Profile Details */}
          <div className="flex-1">
            {editingUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingUser(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</p>
                {userData.addressText && <p className="text-gray-600 mb-1">📍 {userData.addressText}</p>}
                {userData.phoneNumber && <p className="text-gray-600 mb-3">📞 {userData.phoneNumber}</p>}
                <button
                  onClick={() => setEditingUser(true)}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 font-medium transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pups Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pups You Know</h2>
        {userData.pupFriendships.length === 0 ? (
          <p className="text-gray-500">No pups yet</p>
        ) : (
          <div className="space-y-8">
            {userData.pupFriendships.map((friendship) => (
              <div key={friendship.id} className="border-b border-gray-200 last:border-b-0 pb-8 last:pb-0">
                <div className="flex items-start gap-6">
                  {/* Pup Photo */}
                  {friendship.pup.profilePhotoUrl ? (
                    <Image
                      src={friendship.pup.profilePhotoUrl}
                      alt={friendship.pup.name}
                      width={100}
                      height={100}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-25 h-25 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-3xl">
                      🐕
                    </div>
                  )}

                  {/* Pup Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{friendship.pup.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Owner: {friendship.pup.owner.name}
                      {friendship.pup.owner.phoneNumber && ` • ${friendship.pup.owner.phoneNumber}`}
                    </p>
                    {friendship.pup.owner.addressText && (
                      <p className="text-sm text-gray-600 mb-3">📍 {friendship.pup.owner.addressText}</p>
                    )}
                    {friendship.pup.careInstructions && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Care Instructions:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {friendship.pup.careInstructions}
                        </p>
                      </div>
                    )}

                    {/* History */}
                    {editingFriendship === friendship.id ? (
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Your history with {friendship.pup.name}</label>
                        <textarea
                          value={friendHistory}
                          onChange={(e) => setFriendHistory(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-4 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Share your experience with this pup..."
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateFriendship(friendship.id)}
                            disabled={loading}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFriendship(null)}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {friendship.historyWithPup && (
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Your history:</p>
                            <p className="text-sm text-gray-700">{friendship.historyWithPup}</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setEditingFriendship(friendship.id);
                            setFriendHistory(friendship.historyWithPup || '');
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 font-medium transition-all"
                        >
                          Edit History
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
