'use client';

/**
 * Manage Users Component
 *
 * Admin interface for adding/editing users and pups.
 */

import { useState, useEffect } from 'react';
import { User, Pup } from '@prisma/client';

type UserWithPups = User & { ownedPups?: Pup[] };

export default function ManageUsers() {
  const [users, setUsers] = useState<UserWithPups[]>([]);
  const [pups, setPups] = useState<Pup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch users and pups
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, pupsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/pups'),
      ]);

      if (!usersRes.ok || !pupsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const usersData = await usersRes.json();
      const pupsData = await pupsRes.json();

      setUsers(usersData.users || []);
      setPups(pupsData.pups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load users and pups');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Message Banner */}
      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add New Owner */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Owner</h2>
        <AddOwnerForm onSuccess={() => { fetchData(); showMessage('success', 'Owner added successfully!'); }} />
      </section>

      {/* Add New Pup */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Pup</h2>
        <AddPupForm owners={users.filter(u => u.role === 'OWNER')} onSuccess={() => { fetchData(); showMessage('success', 'Pup added successfully!'); }} />
      </section>

      {/* Add New Friend */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Friend</h2>
        <AddFriendForm pups={pups} onSuccess={() => { fetchData(); showMessage('success', 'Friend added successfully!'); }} />
      </section>

      {/* View All Users */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Users</h2>
        <UsersTable users={users} />
      </section>
    </div>
  );
}

/**
 * Add Owner Form
 */
function AddOwnerForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    profilePhotoUrl: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'OWNER',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create owner');
      }

      // Reset form
      setFormData({ name: '', phoneNumber: '', profilePhotoUrl: '', address: '' });
      onSuccess();
    } catch (error) {
      console.error('Error creating owner:', error);
      alert('Failed to create owner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="+1234567890"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo URL
        </label>
        <input
          type="url"
          value={formData.profilePhotoUrl}
          onChange={e => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St, City, State"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Adding...' : 'Add Owner'}
      </button>
    </form>
  );
}

/**
 * Add Pup Form
 */
function AddPupForm({ owners, onSuccess }: { owners: User[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    profilePhotoUrl: '',
    careInstructions: '',
    ownerUserId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/pups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create pup');
      }

      // Reset form
      setFormData({ name: '', breed: '', profilePhotoUrl: '', careInstructions: '', ownerUserId: '' });
      onSuccess();
    } catch (error) {
      console.error('Error creating pup:', error);
      alert('Failed to create pup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Owner <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.ownerUserId}
          onChange={e => setFormData({ ...formData, ownerUserId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select owner...</option>
          {owners.map(owner => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Breed
        </label>
        <input
          type="text"
          value={formData.breed}
          onChange={e => setFormData({ ...formData, breed: e.target.value })}
          placeholder="e.g., Golden Retriever"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo URL
        </label>
        <input
          type="url"
          value={formData.profilePhotoUrl}
          onChange={e => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Care Instructions
        </label>
        <textarea
          value={formData.careInstructions}
          onChange={e => setFormData({ ...formData, careInstructions: e.target.value })}
          rows={3}
          placeholder="Special care notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Adding...' : 'Add Pup'}
      </button>
    </form>
  );
}

/**
 * Add Friend Form
 */
function AddFriendForm({ pups, onSuccess }: { pups: Pup[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    profilePhotoUrl: '',
    address: '',
  });
  const [selectedPups, setSelectedPups] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePupToggle = (pupId: string) => {
    setSelectedPups(prev =>
      prev.includes(pupId)
        ? prev.filter(id => id !== pupId)
        : [...prev, pupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create friend
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'FRIEND',
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to create friend');
      }

      const { user } = await userResponse.json();

      // Create friendships for each selected pup
      await Promise.all(
        selectedPups.map(pupId =>
          fetch(`/api/pups/${pupId}/friends`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendUserId: user.id }),
          })
        )
      );

      // Reset form
      setFormData({ name: '', phoneNumber: '', profilePhotoUrl: '', address: '' });
      setSelectedPups([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating friend:', error);
      alert('Failed to create friend');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="+1234567890"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo URL
        </label>
        <input
          type="url"
          value={formData.profilePhotoUrl}
          onChange={e => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St, City, State"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pups to Care For
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
          {pups.length === 0 ? (
            <p className="text-gray-500 text-sm">No pups available</p>
          ) : (
            pups.map(pup => (
              <label key={pup.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPups.includes(pup.id)}
                  onChange={() => handlePupToggle(pup.id)}
                  className="mr-2"
                />
                <span>{pup.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Adding...' : 'Add Friend'}
      </button>
    </form>
  );
}

/**
 * Users Table
 */
function UsersTable({ users }: { users: UserWithPups[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Info
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'OWNER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {user.phoneNumber || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {user.role === 'OWNER' && user.ownedPups
                  ? `${user.ownedPups.length} pup${user.ownedPups.length !== 1 ? 's' : ''}`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
