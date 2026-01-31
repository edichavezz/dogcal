'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import Image from 'next/image';
import { Phone, Camera, UserPlus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { getEventGradient } from '@/lib/colorUtils';

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
  const router = useRouter();
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

      router.refresh();
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

      setNewFriendName('');
      setNewFriendAddress('');
      setNewFriendPhone('');
      setShowNewFriendForm(false);
      router.refresh();
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

      router.refresh();
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

      // Update local state immediately for both owner and friend views
      const newHistory = friendHistory || null;
      setUserData({
        ...userData,
        // Update for owner view (friendships on owned pups)
        ownedPups: userData.ownedPups.map((pup) => ({
          ...pup,
          friendships: pup.friendships.map((f) =>
            f.id === friendshipId ? { ...f, historyWithPup: newHistory } : f
          ),
        })),
        // Update for friend view (pupFriendships)
        pupFriendships: userData.pupFriendships.map((f) =>
          f.id === friendshipId ? { ...f, historyWithPup: newHistory } : f
        ),
      });
      setEditingFriendship(null);
      router.refresh();
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

      router.refresh();
    } catch (error) {
      console.error('Delete friendship error:', error);
      alert('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  if (user.role === 'OWNER') {
    return (
      <div className="space-y-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Pups and friends</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your profile, pups, and friendships</p>
        </div>

        {/* Owner Profile Section */}
        <div className="bg-[#1a3a3a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your profile</h2>

          <div className="flex items-start gap-4 sm:gap-6">
            <div className="relative group flex-shrink-0">
              <Avatar
                photoUrl={userData.profilePhotoUrl}
                name={userData.name}
                size="xl"
              />
              <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
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

            <div className="flex-1 min-w-0">
              {editingUser ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full border border-[#2a4a4a] bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full border border-[#2a4a4a] bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateUser}
                      disabled={loading}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#f4a9a8] text-[#1a3a3a] rounded-lg sm:rounded-xl font-medium hover:bg-[#f5b9b8] disabled:opacity-50 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUser(false)}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl font-medium hover:bg-[#3a5a5a] text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{userData.name}</h3>
                  <div className="space-y-2 mb-3 sm:mb-4">
                    {userData.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{userData.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingUser(true)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#f4a9a8] text-[#1a3a3a] font-medium hover:bg-[#f5b9b8] transition-colors text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pups Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your pups</h2>

          {userData.ownedPups.length === 0 ? (
            <p className="text-gray-500">No pups yet</p>
          ) : (
            <div className="space-y-6">
              {userData.ownedPups.map((pup) => (
                <div key={pup.id} className="bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#f4a9a8]/20">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="relative group flex-shrink-0">
                      <Avatar
                        photoUrl={pup.profilePhotoUrl}
                        name={pup.name}
                        size="lg"
                      />
                      <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-4 h-4 text-white" />
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

                    <div className="flex-1 min-w-0">
                      {editingPup === pup.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={pupName}
                              onChange={(e) => setPupName(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Care Instructions</label>
                            <textarea
                              value={pupInstructions}
                              onChange={(e) => setPupInstructions(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-4 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                              placeholder="e.g., Walks at 8am and 6pm, eats 2 cups of kibble twice daily..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdatePup(pup.id)}
                              disabled={loading}
                              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#1a3a3a] text-white rounded-lg sm:rounded-xl font-medium hover:bg-[#2a4a4a] disabled:opacity-50 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPup(null)}
                              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-300 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{pup.name}</h3>
                          {pup.careInstructions && (
                            <div className="mb-3">
                              <p className="text-xs sm:text-sm text-gray-700 font-medium mb-1">Care Instructions:</p>
                              <p className="text-xs sm:text-sm text-gray-600 italic">{pup.careInstructions}</p>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setEditingPup(pup.id);
                              setPupName(pup.name);
                              setPupInstructions(pup.careInstructions || '');
                            }}
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1a3a3a] text-white font-medium hover:bg-[#2a4a4a] transition-colors text-sm"
                          >
                            Edit Pup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Friends with this pup */}
                  <div className="pt-4 sm:pt-5 border-t border-[#f4a9a8]/30">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Friends with {pup.name}</h4>

                    {pup.friendships.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-4">No friends yet</p>
                    ) : (
                      <div className="space-y-2 sm:space-y-3 mb-4">
                        {pup.friendships.map((friendship) => {
                          const gradient = getEventGradient(friendship.friend.id);
                          return (
                            <div key={friendship.id} className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div
                                  className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center font-bold shadow-sm flex-shrink-0 text-sm sm:text-base"
                                  style={{
                                    background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`,
                                    color: gradient.text,
                                  }}
                                >
                                  {friendship.friend.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{friendship.friend.name}</h5>
                                  {editingFriendship === friendship.id ? (
                                    <div className="mt-2 space-y-2">
                                      <textarea
                                        value={friendHistory}
                                        onChange={(e) => setFriendHistory(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                                        placeholder="History with this pup..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleUpdateFriendship(friendship.id)}
                                          disabled={loading}
                                          className="px-3 py-1.5 bg-[#1a3a3a] text-white rounded-lg text-xs sm:text-sm hover:bg-[#2a4a4a] font-medium"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingFriendship(null)}
                                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300 font-medium"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">{friendship.historyWithPup || 'No history added'}</p>
                                  )}
                                </div>
                              </div>
                              {editingFriendship !== friendship.id && (
                                <div className="flex gap-2 sm:gap-3 ml-2">
                                  <button
                                    onClick={() => {
                                      setEditingFriendship(friendship.id);
                                      setFriendHistory(friendship.historyWithPup || '');
                                    }}
                                    className="text-[#1a3a3a] hover:text-gray-700 font-medium text-xs sm:text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFriendship(friendship.id)}
                                    className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Friend Section */}
                    {showAddFriend === pup.id ? (
                      <div className="bg-white rounded-lg sm:rounded-xl p-4 border border-gray-200">
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setShowNewFriendForm(false)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                              !showNewFriendForm
                                ? 'bg-[#1a3a3a] text-white'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                          >
                            Select Existing
                          </button>
                          <button
                            onClick={() => setShowNewFriendForm(true)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                              showNewFriendForm
                                ? 'bg-[#1a3a3a] text-white'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                          >
                            Create New
                          </button>
                        </div>

                        {showNewFriendForm ? (
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-800 text-sm">Create New Friend</h5>
                            <input
                              type="text"
                              value={newFriendName}
                              onChange={(e) => setNewFriendName(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] text-sm"
                              placeholder="Friend's name *"
                            />
                            <input
                              type="tel"
                              value={newFriendPhone}
                              onChange={(e) => setNewFriendPhone(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] text-sm"
                              placeholder="Friend's phone (optional)"
                            />
                            <textarea
                              value={friendHistory}
                              onChange={(e) => setFriendHistory(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] text-sm"
                              placeholder="History with pup (optional)"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleCreateNewFriend(pup.id)}
                                disabled={loading || !newFriendName.trim()}
                                className="px-4 py-2 bg-[#f4a9a8] text-[#1a3a3a] rounded-lg hover:bg-[#f5b9b8] disabled:opacity-50 font-medium text-sm"
                              >
                                Create & Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddFriend(null);
                                  setShowNewFriendForm(false);
                                  setNewFriendName('');
                                  setNewFriendPhone('');
                                  setFriendHistory('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <select
                              value={selectedFriend}
                              onChange={(e) => setSelectedFriend(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] text-sm"
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
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] text-sm"
                              placeholder="History with this pup (optional)..."
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAddFriend(pup.id)}
                                disabled={loading || !selectedFriend}
                                className="px-4 py-2 bg-[#f4a9a8] text-[#1a3a3a] rounded-lg hover:bg-[#f5b9b8] disabled:opacity-50 font-medium text-sm"
                              >
                                Add Friend
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddFriend(null);
                                  setSelectedFriend('');
                                  setFriendHistory('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
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
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-300 text-sm"
                      >
                        <UserPlus className="w-4 sm:w-5 h-4 sm:h-5" />
                        Add Friend
                      </button>
                    )}
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
    <div className="space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Pups</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your profile and the pups you care for</p>
      </div>

      {/* Friend Profile Section */}
      <div className="bg-[#1a3a3a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your profile</h2>

        <div className="flex items-start gap-4 sm:gap-6">
          <div className="relative group flex-shrink-0">
            <Avatar
              photoUrl={userData.profilePhotoUrl}
              name={userData.name}
              size="xl"
            />
            <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
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

          <div className="flex-1 min-w-0">
            {editingUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full border border-[#2a4a4a] bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full border border-[#2a4a4a] bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#f4a9a8] text-[#1a3a3a] rounded-lg sm:rounded-xl font-medium hover:bg-[#f5b9b8] disabled:opacity-50 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingUser(false)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#2a4a4a] text-white rounded-lg sm:rounded-xl font-medium hover:bg-[#3a5a5a] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{userData.name}</h3>
                <div className="space-y-2 mb-3 sm:mb-4">
                  {userData.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{userData.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingUser(true)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#f4a9a8] text-[#1a3a3a] font-medium hover:bg-[#f5b9b8] transition-colors text-sm"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pups Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pups you know</h2>

        {userData.pupFriendships.length === 0 ? (
          <p className="text-gray-500">No pups yet</p>
        ) : (
          <div className="space-y-4">
            {userData.pupFriendships.map((friendship) => (
              <div key={friendship.id} className="bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#f4a9a8]/20">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Avatar
                    photoUrl={friendship.pup.profilePhotoUrl}
                    name={friendship.pup.name}
                    size="lg"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{friendship.pup.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Owner: {friendship.pup.owner.name}
                      {friendship.pup.owner.phoneNumber && ` - ${friendship.pup.owner.phoneNumber}`}
                    </p>

                    {friendship.pup.careInstructions && (
                      <div className="bg-white/60 backdrop-blur-sm border border-white/40 p-4 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Care Instructions:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{friendship.pup.careInstructions}</p>
                      </div>
                    )}

                    {editingFriendship === friendship.id ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Your history with {friendship.pup.name}</label>
                        <textarea
                          value={friendHistory}
                          onChange={(e) => setFriendHistory(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                          placeholder="Share your experience with this pup..."
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateFriendship(friendship.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-[#1a3a3a] text-white rounded-lg hover:bg-[#2a4a4a] disabled:opacity-50 font-medium text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFriendship(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {friendship.historyWithPup && (
                          <div className="bg-white/60 backdrop-blur-sm border border-white/40 p-4 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Your history:</p>
                            <p className="text-sm text-gray-700">{friendship.historyWithPup}</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setEditingFriendship(friendship.id);
                            setFriendHistory(friendship.historyWithPup || '');
                          }}
                          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1a3a3a] text-white font-medium hover:bg-[#2a4a4a] transition-colors text-sm"
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
