'use client';

/**
 * Username Login Form
 *
 * Universal login form that accepts both admin and user usernames.
 * - Admin username: Redirect to admin page with username in URL
 * - User username: Log in via API and redirect to home/calendar
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TokenLoginFormProps {
  error?: string;
}

export default function TokenLoginForm({ error: initialError }: TokenLoginFormProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    const trimmedUsername = username.trim();

    try {
      // Validate the username via API
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      const data = await response.json();

      if (data.valid) {
        if (data.type === 'admin') {
          // Redirect to admin page with username
          router.push(`/admin?token=${encodeURIComponent(trimmedUsername)}`);
        } else if (data.type === 'user') {
          // User is now logged in (cookie set by API), redirect to home
          router.push('/');
        }
      } else {
        setError('Invalid username. Please check your username and try again.');
        setLoading(false);
      }
    } catch {
      setError('Failed to validate username. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a3a3a] to-[#2a4a4a] px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/full-dogcal-logo-pink.svg"
            alt="DogCal"
            width={200}
            height={80}
            priority
          />
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-2xl sm:rounded-3xl p-8">
          {/* Welcome text */}
          <h1 className="text-2xl font-bold text-[#1a3a3a] mb-2 text-center">
            Welcome back!
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your username to continue
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-[#f4a9a8]/20 border border-[#f4a9a8] rounded-xl text-sm text-[#1a3a3a]">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#1a3a3a] mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]/50 focus:border-[#f4a9a8] transition-colors"
                disabled={loading}
                autoFocus
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-[#f4a9a8] text-[#1a3a3a] py-3 px-6 rounded-xl hover:bg-[#f4a9a8]/80 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={20} />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Don&apos;t have a username? Contact Edi to get your personal login link.
            </p>
            <div className="text-center">
              <Link
                href="/about"
                className="text-sm text-[#1a3a3a] font-medium hover:underline"
              >
                Learn more about dogcal →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/60">
          Coordinate care time for your pups with friends
        </p>
      </div>
    </div>
  );
}
