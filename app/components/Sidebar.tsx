'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, Users, Home, Plus, CheckSquare, Lightbulb, Info } from 'lucide-react';
import Avatar from './Avatar';
import PawsIcon from './PawsIcon';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  profilePhotoUrl?: string | null;
};

type SidebarProps = {
  user: User;
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const ownerTabs = [
    { id: 'home', path: '/', label: 'Home', icon: Home },
    { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar },
    { id: 'create', path: '/hangouts/new', label: 'Create hangout', icon: Plus },
    { id: 'approvals', path: '/approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'pups', path: '/manage', label: 'Pups and friends', icon: Users },
  ];

  const friendTabs = [
    { id: 'home', path: '/', label: 'Home', icon: Home },
    { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar },
    { id: 'suggest', path: '/suggest', label: 'Suggest time', icon: Lightbulb },
    { id: 'pups', path: '/manage', label: 'Pups', icon: Users },
  ];

  const tabs = useMemo(
    () => (user.role === 'OWNER' ? ownerTabs : friendTabs),
    [user.role]
  );

  useEffect(() => {
    const prefetchTabs = () => {
      for (const tab of tabs) {
        if (tab.path !== pathname) {
          router.prefetch(tab.path);
        }
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const callbackId = window.requestIdleCallback(prefetchTabs, { timeout: 1200 });
      return () => window.cancelIdleCallback(callbackId);
    }

    const timeoutId = setTimeout(prefetchTabs, 200);
    return () => clearTimeout(timeoutId);
  }, [pathname, router, tabs]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1a3a3a] min-h-screen flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a4a4a]">
          <Link href="/" className="flex items-center gap-3">
            <PawsIcon size={32} color="pink" />
            <span className="text-lg font-semibold text-white">dogcal</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  onMouseEnter={() => router.prefetch(tab.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#f4a9a8] text-[#1a3a3a]'
                      : 'text-gray-300 hover:text-white hover:bg-[#2a4a4a]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* About link */}
        <div className="px-4 pb-2">
          <Link
            href="/about"
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive('/about')
                ? 'bg-[#f4a9a8] text-[#1a3a3a]'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#2a4a4a]'
            }`}
          >
            <Info className="w-4 h-4" />
            About dogcal
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a4a4a]">
          <Link
            href="/manage"
            onMouseEnter={() => router.prefetch('/manage')}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2a4a4a] transition-colors"
          >
            <Avatar
              photoUrl={user.profilePhotoUrl}
              name={user.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-gray-400">
                {user.role === 'OWNER' ? 'Owner' : 'Friend'}
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
