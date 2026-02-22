'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import PhotoUploader from '@/components/PhotoUploader';
import { getPupColor, getFriendColor } from '@/lib/colorUtils';

type User = {
  id: string;
  name: string;
  addressText?: string | null;
  profilePhotoUrl?: string | null;
  role: 'OWNER' | 'FRIEND';
  ownedPups?: Array<{
    id: string;
    name: string;
    careInstructions?: string | null;
    profilePhotoUrl?: string | null;
    friendships: Array<{
      id: string;
      historyWithPup?: string | null;
      friend: {
        id: string;
        name: string;
        profilePhotoUrl?: string | null;
      };
    }>;
  }>;
  pupFriendships?: Array<{
    id: string;
    historyWithPup?: string | null;
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
  }>;
};

type FriendsAndPetsClientProps = {
  user: User;
  allUsers: Array<{
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  }>;
};

export default function FriendsAndPetsClient({
  user,
  allUsers,
}: FriendsAndPetsClientProps) {
  const router = useRouter();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    addressText: user.addressText || '',
    profilePhotoUrl: user.profilePhotoUrl,
  });

  // Owner-specific state
  const [addingPup, setAddingPup] = useState(false);
  const [newPupData, setNewPupData] = useState({
    name: '',
    careInstructions: '',
    profilePhotoUrl: null as string | null,
  });
  const [editingPup, setEditingPup] = useState<string | null>(null);
  const [editPupData, setEditPupData] = useState<{
    name: string;
    careInstructions: string;
    profilePhotoUrl: string | null;
  }>({ name: '', careInstructions: '', profilePhotoUrl: null });

  const [addingFriendToPup, setAddingFriendToPup] = useState<string | null>(
    null
  );
  const [newFriendOption, setNewFriendOption] = useState<'existing' | 'new'>(
    'existing'
  );
  const [selectedExistingFriend, setSelectedExistingFriend] = useState('');
  const [newFriendData, setNewFriendData] = useState({
    name: '',
    addressText: '',
  });

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setEditingProfile(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddPup = async () => {
    try {
      const response = await fetch('/api/pups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPupData),
      });

      if (!response.ok) throw new Error('Failed to create pup');

      setAddingPup(false);
      setNewPupData({ name: '', careInstructions: '', profilePhotoUrl: null });
      router.refresh();
    } catch (error) {
      console.error('Error creating pup:', error);
      alert('Failed to create pup');
    }
  };

  const handleEditPup = (pup: {
    id: string;
    name: string;
    careInstructions?: string | null;
    profilePhotoUrl?: string | null;
  }) => {
    setEditingPup(pup.id);
    setEditPupData({
      name: pup.name,
      careInstructions: pup.careInstructions || '',
      profilePhotoUrl: pup.profilePhotoUrl || null,
    });
  };

  const handleSavePup = async (pupId: string) => {
    try {
      const response = await fetch(`/api/pups/${pupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPupData),
      });

      if (!response.ok) throw new Error('Failed to update pup');

      setEditingPup(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating pup:', error);
      alert('Failed to update pup');
    }
  };

  const handleDeletePup = async (pupId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this pup? This will also delete all hangouts.'
      )
    )
      return;

    try {
      const response = await fetch(`/api/pups/${pupId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete pup');
      router.refresh();
    } catch (error) {
      console.error('Error deleting pup:', error);
      alert('Failed to delete pup');
    }
  };

  const handleAddFriend = async (pupId: string) => {
    try {
      let friendId = selectedExistingFriend;

      // If creating new friend, create them first
      if (newFriendOption === 'new') {
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFriendData),
        });

        if (!createResponse.ok) throw new Error('Failed to create friend');
        const { user: newFriend } = await createResponse.json();
        friendId = newFriend.id;
      }

      // Create friendship
      const response = await fetch('/api/friendships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pupId, friendUserId: friendId }),
      });

      if (!response.ok) throw new Error('Failed to add friend');

      setAddingFriendToPup(null);
      setSelectedExistingFriend('');
      setNewFriendData({ name: '', addressText: '' });
      router.refresh();
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      const response = await fetch(`/api/friendships/${friendshipId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove friend');
      router.refresh();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My profile</h2>

        {editingProfile ? (
          <div className="space-y-4">
            <PhotoUploader
              currentPhotoUrl={profileData.profilePhotoUrl}
              onPhotoChange={(url) =>
                setProfileData({ ...profileData, profilePhotoUrl: url })
              }
              label="Profile Photo"
              size="medium"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            {user.role === 'OWNER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.addressText}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      addressText: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                disabled={!profileData.name}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <Avatar photoUrl={user.profilePhotoUrl} name={user.name} size="lg" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.name}
              </h3>
              {user.addressText && (
                <p className="text-gray-600">{user.addressText}</p>
              )}
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OWNER VIEW */}
      {user.role === 'OWNER' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">My pups</h2>
            <button
              onClick={() => setAddingPup(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500"
            >
              + Add Pup
            </button>
          </div>

          {addingPup && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-yellow-400">
              <h3 className="text-lg font-semibold mb-4">Add new pup</h3>
              <div className="space-y-4">
                <PhotoUploader
                  currentPhotoUrl={newPupData.profilePhotoUrl}
                  onPhotoChange={(url) =>
                    setNewPupData({ ...newPupData, profilePhotoUrl: url })
                  }
                  label="Pup Photo"
                  size="medium"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newPupData.name}
                    onChange={(e) =>
                      setNewPupData({ ...newPupData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Care Instructions
                  </label>
                  <textarea
                    value={newPupData.careInstructions}
                    onChange={(e) =>
                      setNewPupData({
                        ...newPupData,
                        careInstructions: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPup}
                    disabled={!newPupData.name}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50"
                  >
                    Add Pup
                  </button>
                  <button
                    onClick={() => {
                      setAddingPup(false);
                      setNewPupData({
                        name: '',
                        careInstructions: '',
                        profilePhotoUrl: null,
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {user.ownedPups?.map((pup) => (
            <div
              key={pup.id}
              className="bg-white rounded-lg shadow-sm p-6 border-2"
              style={{ borderColor: getPupColor(pup.id) }}
            >
              {editingPup === pup.id ? (
                <div className="space-y-4">
                  <PhotoUploader
                    currentPhotoUrl={editPupData.profilePhotoUrl}
                    onPhotoChange={(url) =>
                      setEditPupData({ ...editPupData, profilePhotoUrl: url })
                    }
                    label="Pup Photo"
                    size="medium"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editPupData.name}
                      onChange={(e) =>
                        setEditPupData({ ...editPupData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Care Instructions
                    </label>
                    <textarea
                      value={editPupData.careInstructions}
                      onChange={(e) =>
                        setEditPupData({
                          ...editPupData,
                          careInstructions: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSavePup(pup.id)}
                      disabled={!editPupData.name}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPup(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar
                      photoUrl={pup.profilePhotoUrl}
                      name={pup.name}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {pup.name}
                      </h3>
                      {pup.careInstructions && (
                        <p className="text-gray-600 mt-1">
                          {pup.careInstructions}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4">
                        <button
                          onClick={() => handleEditPup(pup)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit Pup
                        </button>
                        <button
                          onClick={() => handleDeletePup(pup.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete Pup
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Friends
                      </h4>
                      <button
                        onClick={() => setAddingFriendToPup(pup.id)}
                        className="px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600"
                      >
                        + Add Friend
                      </button>
                    </div>

                    {addingFriendToPup === pup.id && (
                      <div className="mb-4 p-4 bg-amber-50 rounded-md border border-amber-200">
                        <div className="space-y-3">
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={newFriendOption === 'existing'}
                                onChange={() =>
                                  setNewFriendOption('existing')
                                }
                              />
                              <span>Link Existing Friend</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={newFriendOption === 'new'}
                                onChange={() => setNewFriendOption('new')}
                              />
                              <span>Create New Friend</span>
                            </label>
                          </div>

                          {newFriendOption === 'existing' ? (
                            <select
                              value={selectedExistingFriend}
                              onChange={(e) =>
                                setSelectedExistingFriend(e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                              <option value="">Select a friend...</option>
                              {allUsers
                                .filter(
                                  (u) =>
                                    !pup.friendships.some(
                                      (f) => f.friend.id === u.id
                                    )
                                )
                                .map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Friend's name"
                                value={newFriendData.name}
                                onChange={(e) =>
                                  setNewFriendData({
                                    ...newFriendData,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                              <input
                                type="text"
                                placeholder="Address (optional)"
                                value={newFriendData.addressText}
                                onChange={(e) =>
                                  setNewFriendData({
                                    ...newFriendData,
                                    addressText: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddFriend(pup.id)}
                              disabled={
                                newFriendOption === 'existing'
                                  ? !selectedExistingFriend
                                  : !newFriendData.name
                              }
                              className="px-4 py-2 bg-amber-500 text-white font-medium rounded-md hover:bg-amber-600 disabled:opacity-50"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setAddingFriendToPup(null);
                                setSelectedExistingFriend('');
                                setNewFriendData({ name: '', addressText: '' });
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {pup.friendships.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No friends linked yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pup.friendships.map((friendship) => (
                          <div
                            key={friendship.id}
                            className="flex items-center gap-3 p-3 rounded-md border-2"
                            style={{
                              borderColor: getFriendColor(friendship.friend.id),
                            }}
                          >
                            <Avatar
                              photoUrl={friendship.friend.profilePhotoUrl}
                              name={friendship.friend.name}
                              size="sm"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {friendship.friend.name}
                              </p>
                              {friendship.historyWithPup && (
                                <p className="text-xs text-gray-600">
                                  {friendship.historyWithPup}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveFriend(friendship.id)
                              }
                              className="text-red-500 hover:text-red-700 text-lg font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FRIEND VIEW */}
      {user.role === 'FRIEND' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Pups I care for
          </h2>

          {user.pupFriendships?.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-500 italic">
                You haven&apos;t been linked to any pups yet.
              </p>
            </div>
          ) : (
            user.pupFriendships?.map((friendship) => (
              <div
                key={friendship.id}
                className="bg-white rounded-lg shadow-sm p-6 border-2"
                style={{ borderColor: getPupColor(friendship.pup.id) }}
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    photoUrl={friendship.pup.profilePhotoUrl}
                    name={friendship.pup.name}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {friendship.pup.name}
                    </h3>
                    <p className="text-gray-600">
                      Owner: {friendship.pup.owner.name}
                    </p>
                    {friendship.pup.careInstructions && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700">
                          Care Instructions:
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {friendship.pup.careInstructions}
                        </p>
                      </div>
                    )}
                    {friendship.historyWithPup && (
                      <p className="text-sm text-gray-600 mt-2">
                        History: {friendship.historyWithPup}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
