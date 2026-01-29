import { Calendar, Plus, CheckSquare, Users } from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: 'calendar' | 'create' | 'approvals' | 'pups') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 pt-20 lg:pt-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
          Welcome back, Edi & Tom! 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage your pups' hangouts and care schedules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1 bg-[#1a3a3a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#f4a9a8] flex items-center justify-center text-[#1a3a3a] font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
              E
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-1">Edi & Tom</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a4a4a] text-xs sm:text-sm mb-3 sm:mb-4">
              <div className="w-2 h-2 rounded-full bg-[#f4a9a8]"></div>
              Owner
            </div>
            <p className="text-gray-300 text-xs sm:text-sm mb-1">+44743628512</p>
            <p className="text-gray-400 text-xs sm:text-sm">123 Demo Street, London</p>
          </div>
        </div>

        {/* Your Pups Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#f4a9a8]/20">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🐶 Your Pups</h2>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/40">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg flex-shrink-0">
                🐕
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">Max</h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Golden Labrador</p>
                <p className="text-xs sm:text-sm text-gray-600 italic">
                  Needs 2 walks daily, loves treats!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => onNavigate('calendar')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all text-left group border border-gray-200"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
              <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">View Calendar</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">See all scheduled hangouts</p>
          </button>

          <button
            onClick={() => onNavigate('create')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all text-left group border border-gray-200"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
              <Plus className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Create Hangout</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Schedule a time for your pup</p>
          </button>

          <button
            onClick={() => onNavigate('approvals')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all text-left group border border-gray-200"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
              <CheckSquare className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Review Suggestions</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Approve or reject suggestions</p>
          </button>

          <button
            onClick={() => onNavigate('pups')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all text-left group border border-gray-200"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
              <Users className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Pups & Friends</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Edit pups and friendships</p>
          </button>
        </div>
      </div>
    </div>
  );
}