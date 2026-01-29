import { Calendar, Users, Home, User, Settings } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface SidebarProps {
  activeTab: 'home' | 'calendar' | 'create' | 'approvals' | 'pups';
  onTabChange: (tab: 'home' | 'calendar' | 'create' | 'approvals' | 'pups') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'pups' as const, label: 'Pups', icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1a3a3a] min-h-screen flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a4a4a]">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#f4a9a8"/>
              <ellipse cx="11" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <ellipse cx="21" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <path d="M 10 20 Q 16 24 22 20" stroke="#1a3a3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="9" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="23" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="6" cy="11" r="2" fill="#f4a9a8"/>
              <circle cx="26" cy="11" r="2" fill="#f4a9a8"/>
            </svg>
            <span className="text-lg font-semibold text-white">dogcal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[#f4a9a8] text-[#1a3a3a]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a4a4a]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label === 'Pups' ? 'Pups and friends' : tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a4a4a]">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2a4a4a] transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#f4a9a8] flex items-center justify-center text-[#1a3a3a] font-semibold">
              E
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Edi & Tom</div>
              <div className="text-xs text-gray-400">Owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a3a3a] border-b border-[#2a4a4a] z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#f4a9a8"/>
              <ellipse cx="11" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <ellipse cx="21" cy="13" rx="2" ry="2.5" fill="#1a3a3a"/>
              <path d="M 10 20 Q 16 24 22 20" stroke="#1a3a3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="9" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="23" cy="8" r="3" fill="#f4a9a8"/>
              <circle cx="6" cy="11" r="2" fill="#f4a9a8"/>
              <circle cx="26" cy="11" r="2" fill="#f4a9a8"/>
            </svg>
            <span className="text-lg font-semibold text-white">PawCal</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f4a9a8] flex items-center justify-center text-[#1a3a3a] font-semibold">
            E
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a3a3a] border-t border-[#2a4a4a] z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[70px]",
                  activeTab === tab.id
                    ? "bg-[#f4a9a8] text-[#1a3a3a]"
                    : "text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}