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
    <nav className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                DogCal
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/calendar"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/calendar')
                  ? 'bg-amber-50 text-amber-900 border-b-2 border-amber-500'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Calendar
            </Link>

            {user.role === 'OWNER' && (
              <>
                <Link
                  href="/hangouts/new"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/hangouts/new')
                      ? 'bg-amber-50 text-amber-900 border-b-2 border-amber-500'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Create Hangout
                </Link>
                <Link
                  href="/approvals"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/approvals')
                      ? 'bg-amber-50 text-amber-900 border-b-2 border-amber-500'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Approvals
                </Link>
              </>
            )}

            {user.role === 'FRIEND' && (
              <Link
                href="/suggest"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/suggest')
                    ? 'bg-amber-50 text-amber-900 border-b-2 border-amber-500'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Suggest Time
              </Link>
            )}
          </div>

          {/* User Info and Role Badge */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">
                {user.role === 'OWNER' ? 'Pup Owner' : 'Pup Friend'}
              </div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${
                user.role === 'OWNER'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
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
