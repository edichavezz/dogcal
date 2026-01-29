'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  profilePhotoUrl?: string | null;
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

  const owners = users.filter((u) => u.role === 'OWNER');
  const friends = users.filter((u) => u.role === 'FRIEND');

  // Helper to check if image URL is from allowed domain
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Only allow Supabase images (configured in next.config.ts)
    return url.includes('supabase.co');
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Owners Section */}
      {owners.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Pup Owners</h3>
          <div className="grid grid-cols-2 gap-3">
            {owners.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                disabled={loading}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                  selectedUserId === user.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200 bg-white'
                } disabled:opacity-50`}
              >
                {isValidImageUrl(user.profilePhotoUrl) ? (
                  <Image
                    src={user.profilePhotoUrl!}
                    alt={user.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover mb-2"
                  />
                ) : (
                  <div className="w-15 h-15 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl text-orange-600 font-semibold">{user.name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-center">{user.name}</span>
                <span className="text-xs text-gray-500">Owner</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friends Section */}
      {friends.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Pup Friends</h3>
          <div className="grid grid-cols-2 gap-3">
            {friends.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                disabled={loading}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                  selectedUserId === user.id
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-200 bg-white'
                } disabled:opacity-50`}
              >
                {isValidImageUrl(user.profilePhotoUrl) ? (
                  <Image
                    src={user.profilePhotoUrl!}
                    alt={user.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover mb-2"
                  />
                ) : (
                  <div className="w-15 h-15 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl text-amber-600 font-semibold">{user.name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-center">{user.name}</span>
                <span className="text-xs text-gray-500">Friend</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size={32} message="Signing in..." />
        </div>
      )}
    </div>
  );
}
