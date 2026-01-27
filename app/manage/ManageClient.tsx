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

      const { url } = await res.json();

      // Update local state
      if (entityType === 'user') {
        setUserData({ ...userData, profilePhotoUrl: url });
      } else {
        setUserData({
          ...userData,
          ownedPups: userData.ownedPups.map((p) =>
            p.id === entityId ? { ...p, profilePhotoUrl: url } : p
          ),
        });
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Pups & Friends</h1>

          {/* Owner Profile Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
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
                  <div className="w-30 h-30 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                    {userData.name.charAt(0)}
                  </div>
                )}
                <label className="mt-2 px-3 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-sm">
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
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateUser}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-semibold mb-2">{userData.name}</p>
                    {userData.addressText && <p className="text-gray-600 mb-1">{userData.addressText}</p>}
                    {userData.phoneNumber && <p className="text-gray-600 mb-1">{userData.phoneNumber}</p>}
                    <button
                      onClick={() => setEditingUser(true)}
                      className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pups Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Your Pups</h2>
            {userData.ownedPups.map((pup) => (
              <div key={pup.id} className="border-b last:border-b-0 pb-6 mb-6 last:mb-0">
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
                      <div className="w-25 h-25 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                        🐕
                      </div>
                    )}
                    <label className="mt-2 px-2 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-xs">
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
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            value={pupName}
                            onChange={(e) => setPupName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Care Instructions
                            <span className="text-gray-500 text-xs block mt-1">
                              Share details about your pup&apos;s routine: walk schedules, feeding times, favorite treats,
                              how many poos are normal, play preferences, known tricks, training tips, special needs, etc.
                            </span>
                          </label>
                          <textarea
                            value={pupInstructions}
                            onChange={(e) => setPupInstructions(e.target.value)}
                            className="w-full border rounded px-3 py-2 h-32"
                            placeholder="e.g., Walks at 8am and 6pm, eats 2 cups of kibble twice daily, loves fetch, knows sit/stay/down, usually poos 2x per day..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePup(pup.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPup(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{pup.name}</h3>
                        {pup.careInstructions && (
                          <p className="text-gray-600 mb-3 whitespace-pre-wrap">{pup.careInstructions}</p>
                        )}
                        <button
                          onClick={() => {
                            setEditingPup(pup.id);
                            setPupName(pup.name);
                            setPupInstructions(pup.careInstructions || '');
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit Pup
                        </button>

                        {/* Friends for this pup */}
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Friends with {pup.name}</h4>
                          {pup.friendships.length === 0 ? (
                            <p className="text-gray-500 text-sm">No friends yet</p>
                          ) : (
                            <div className="space-y-2">
                              {pup.friendships.map((friendship) => (
                                <div key={friendship.id} className="bg-gray-50 p-3 rounded">
                                  <div className="flex items-center gap-3">
                                    {friendship.friend.profilePhotoUrl ? (
                                      <Image
                                        src={friendship.friend.profilePhotoUrl}
                                        alt={friendship.friend.name}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        {friendship.friend.name.charAt(0)}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium">{friendship.friend.name}</p>
                                      {editingFriendship === friendship.id ? (
                                        <div className="mt-2 space-y-2">
                                          <textarea
                                            value={friendHistory}
                                            onChange={(e) => setFriendHistory(e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            placeholder="History with this pup..."
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleUpdateFriendship(friendship.id)}
                                              disabled={loading}
                                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingFriendship(null)}
                                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {friendship.historyWithPup && (
                                            <p className="text-sm text-gray-600">{friendship.historyWithPup}</p>
                                          )}
                                          <div className="flex gap-2 mt-1">
                                            <button
                                              onClick={() => {
                                                setEditingFriendship(friendship.id);
                                                setFriendHistory(friendship.historyWithPup || '');
                                              }}
                                              className="text-sm text-blue-500 hover:underline"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteFriendship(friendship.id)}
                                              className="text-sm text-red-500 hover:underline"
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
                            <div className="mt-4 bg-gray-50 p-4 rounded">
                              <h5 className="font-medium mb-2">Add Friend</h5>
                              <div className="space-y-3">
                                <select
                                  value={selectedFriend}
                                  onChange={(e) => setSelectedFriend(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
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
                                  className="w-full border rounded px-3 py-2"
                                  placeholder="History with this pup (optional)..."
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddFriend(pup.id)}
                                    disabled={loading || !selectedFriend}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  >
                                    Add Friend
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowAddFriend(null);
                                      setSelectedFriend('');
                                      setFriendHistory('');
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddFriend(pup.id)}
                              className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Add Friend
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
        </div>
      </div>
    );
  }

  // FRIEND VIEW
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pups</h1>

        {/* Friend Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
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
                <div className="w-30 h-30 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                  {userData.name.charAt(0)}
                </div>
              )}
              <label className="mt-2 px-3 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-sm">
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
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateUser}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUser(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-semibold mb-2">{userData.name}</p>
                  {userData.addressText && <p className="text-gray-600 mb-1">{userData.addressText}</p>}
                  {userData.phoneNumber && <p className="text-gray-600 mb-1">{userData.phoneNumber}</p>}
                  <button
                    onClick={() => setEditingUser(true)}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pups Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Pups You Know</h2>
          {userData.pupFriendships.length === 0 ? (
            <p className="text-gray-500">No pups yet</p>
          ) : (
            <div className="space-y-6">
              {userData.pupFriendships.map((friendship) => (
                <div key={friendship.id} className="border-b last:border-b-0 pb-6 last:pb-0">
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
                      <div className="w-25 h-25 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                        🐕
                      </div>
                    )}

                    {/* Pup Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{friendship.pup.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Owner: {friendship.pup.owner.name}
                        {friendship.pup.owner.phoneNumber && ` • ${friendship.pup.owner.phoneNumber}`}
                      </p>
                      {friendship.pup.owner.addressText && (
                        <p className="text-sm text-gray-600 mb-2">{friendship.pup.owner.addressText}</p>
                      )}
                      {friendship.pup.careInstructions && (
                        <div className="bg-blue-50 p-3 rounded mb-3">
                          <p className="text-sm font-medium mb-1">Care Instructions:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {friendship.pup.careInstructions}
                          </p>
                        </div>
                      )}

                      {/* History */}
                      {editingFriendship === friendship.id ? (
                        <div className="mt-3 space-y-2">
                          <label className="block text-sm font-medium">Your history with {friendship.pup.name}</label>
                          <textarea
                            value={friendHistory}
                            onChange={(e) => setFriendHistory(e.target.value)}
                            className="w-full border rounded px-3 py-2 h-24"
                            placeholder="Share your experience with this pup..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateFriendship(friendship.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFriendship(null)}
                              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {friendship.historyWithPup && (
                            <div className="bg-gray-50 p-3 rounded mb-3">
                              <p className="text-sm font-medium mb-1">Your history:</p>
                              <p className="text-sm text-gray-700">{friendship.historyWithPup}</p>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setEditingFriendship(friendship.id);
                              setFriendHistory(friendship.historyWithPup || '');
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
    </div>
  );
}
