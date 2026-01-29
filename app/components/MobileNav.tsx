'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Home } from 'lucide-react';
import Avatar from './Avatar';
import PawsIcon from './PawsIcon';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  profilePhotoUrl?: string | null;
};

type MobileNavProps = {
  user: User;
};

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Mobile nav shows 3 main tabs
  const tabs = [
    { id: 'home', path: '/', label: 'Home', icon: Home },
    { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar },
    { id: 'pups', path: '/manage', label: 'Pups', icon: Users },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a3a] border-b border-[#2a4a4a] z-50">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <PawsIcon size={28} color="pink" />
            <span className="text-lg font-semibold text-white">dogcal</span>
          </Link>
          <Link href="/manage">
            <Avatar
              photoUrl={user.profilePhotoUrl}
              name={user.name}
              size="sm"
            />
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a3a3a] border-t border-[#2a4a4a] z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px] ${
                  active
                    ? 'bg-[#f4a9a8] text-[#1a3a3a]'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
