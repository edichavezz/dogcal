'use client';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

type User = {
  id: string;
  name: string;
  role: 'OWNER' | 'FRIEND';
  profilePhotoUrl?: string | null;
};

type AppLayoutProps = {
  user: User;
  children: React.ReactNode;
};

export default function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Mobile Navigation */}
      <MobileNav user={user} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 h-full overflow-hidden">
        {/* Add padding for mobile top/bottom nav */}
        <div className="pt-16 pb-20 lg:pt-0 lg:pb-0 h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
