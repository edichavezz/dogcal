'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  addressText?: string | null;
};

type TopNavProps = {
  user: User;
};

export default function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b-2 border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-gray-800">DogCal</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/calendar"
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive('/calendar')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Calendar
            </Link>

            {user.role === 'OWNER' && (
              <>
                <Link
                  href="/hangouts/new"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/hangouts/new')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Create Hangout
                </Link>
                <Link
                  href="/approvals"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/approvals')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Approvals
                </Link>
              </>
            )}

            {user.role === 'FRIEND' && (
              <Link
                href="/suggest"
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/suggest')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Suggest Time
              </Link>
            )}
          </div>

          {/* User Info and Role Badge */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-800">{user.name}</div>
              <div className="text-xs text-gray-500">
                {user.role === 'OWNER' ? 'Pup Owner' : 'Pup Friend'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.role === 'OWNER'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {user.role === 'OWNER' ? '🏠 Owner' : '🤝 Friend'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
