import { Calendar, Users, Home, User } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface NavigationProps {
  activeTab: 'home' | 'calendar' | 'create' | 'approvals' | 'pups';
  onTabChange: (tab: 'home' | 'calendar' | 'create' | 'approvals' | 'pups') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'pups' as const, label: 'Pups & Friends', icon: Users },
  ];

  return (
    <nav className="bg-[#1a3a3a] border-b border-[#2a4a4a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐾</div>
            <span className="text-xl font-semibold text-white">PawCal</span>
          </div>
          
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[#f4a9a8] text-[#1a3a3a]"
                      : "text-gray-300 hover:text-white hover:bg-[#2a4a4a]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300">Edi & Tom</div>
            <div className="w-9 h-9 rounded-full bg-[#f4a9a8] flex items-center justify-center text-[#1a3a3a] font-semibold">
              E
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}