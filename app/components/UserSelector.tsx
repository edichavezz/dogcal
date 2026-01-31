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
    <div className="w-full space-y-4">
      {/* Owners Section */}
      {owners.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pup Owners</h3>
          <div className="flex flex-wrap gap-2">
            {owners.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                  selectedUserId === user.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200 bg-white hover:bg-orange-50/50'
                } disabled:opacity-50`}
              >
                {isValidImageUrl(user.profilePhotoUrl) ? (
                  <Image
                    src={user.profilePhotoUrl!}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-orange-600 font-semibold">{user.name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-medium whitespace-nowrap">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friends Section */}
      {friends.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pup Friends</h3>
          <div className="flex flex-wrap gap-2">
            {friends.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                  selectedUserId === user.id
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-200 bg-white hover:bg-amber-50/50'
                } disabled:opacity-50`}
              >
                {isValidImageUrl(user.profilePhotoUrl) ? (
                  <Image
                    src={user.profilePhotoUrl!}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-amber-600 font-semibold">{user.name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-medium whitespace-nowrap">{user.name}</span>
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
