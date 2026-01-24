'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
};

export default function UserSelector() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch all users
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }, []);

  const handleUserSelect = async (userId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/acting-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Redirect to calendar after selecting user
        router.push('/calendar');
      } else {
        console.error('Failed to set acting user');
      }
    } catch (error) {
      console.error('Error setting acting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="w-full px-4 py-3 text-lg border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
        disabled={loading}
      >
        <option value="">Choose a user...</option>
        <optgroup label="Pup Owners">
          {users
            .filter((u) => u.role === 'OWNER')
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Pup Friends">
          {users
            .filter((u) => u.role === 'FRIEND')
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </optgroup>
      </select>

      <button
        onClick={() => handleUserSelect(selectedUserId)}
        disabled={!selectedUserId || loading}
        className="w-full px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Loading...' : 'Continue'}
      </button>
    </div>
  );
}
