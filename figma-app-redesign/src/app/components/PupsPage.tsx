import { Phone, Edit, Trash2, UserPlus, Camera } from 'lucide-react';

export function PupsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 pt-20 lg:pt-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Pups and friends</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your profile, pups, and friendships</p>
      </div>

      {/* Your Profile */}
      <div className="bg-[#1a3a3a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-4 sm:mb-6 text-white">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your Profile</h2>
        
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="relative group flex-shrink-0">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#f4a9a8] flex items-center justify-center text-[#1a3a3a] font-bold text-xl sm:text-2xl">
              E
            </div>
            <button className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Edi & Tom</h3>
            
            <div className="space-y-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">+44743628512</span>
              </div>
            </div>

            <button className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#f4a9a8] text-[#1a3a3a] font-medium hover:bg-[#f5b9b8] transition-colors text-sm">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Your Pups */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-5 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Pups</h2>
        
        <div className="bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#f4a9a8]/20">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-[#f4a9a8] rounded-full flex items-center justify-center text-lg sm:text-xl font-semibold text-white shadow-lg flex-shrink-0">
              M
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Max</h3>
              
              <div className="mb-3">
                <p className="text-xs sm:text-sm text-gray-700 font-medium mb-1">Care Instructions:</p>
                <p className="text-xs sm:text-sm text-gray-600 italic">
                  Needs 2 walks daily, loves treats!
                </p>
              </div>

              <button className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1a3a3a] text-white font-medium hover:bg-[#2a4a4a] transition-colors text-sm">
                Edit Pup
              </button>
            </div>
          </div>

          {/* Friends with Max */}
          <div className="pt-4 sm:pt-5 border-t border-[#f4a9a8]/30">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Friends with Max</h4>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-[#b8d4ff] to-[#c8e0ff] flex items-center justify-center text-blue-700 font-bold shadow-sm flex-shrink-0 text-sm sm:text-base">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Alex</h5>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">Friends for 2 years, very experienced</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-2">
                  <button className="text-[#1a3a3a] hover:text-gray-700 font-medium text-xs sm:text-sm">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm">
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-[#e4c4f1] to-[#f0daf5] flex items-center justify-center text-purple-700 font-bold shadow-sm flex-shrink-0 text-sm sm:text-base">
                    J
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Jamie</h5>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">New friend, learning the ropes</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-2">
                  <button className="text-[#1a3a3a] hover:text-gray-700 font-medium text-xs sm:text-sm">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm">
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-[#c4f1be] to-[#daf5d7] flex items-center justify-center text-green-700 font-bold shadow-sm flex-shrink-0 text-sm sm:text-base">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Sam</h5>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">Great with active dogs</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-2">
                  <button className="text-[#1a3a3a] hover:text-gray-700 font-medium text-xs sm:text-sm">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm">
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-[#ffd4a9] to-[#ffe4c4] flex items-center justify-center text-orange-700 font-bold shadow-sm flex-shrink-0 text-sm sm:text-base">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Morgan</h5>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">Weekend availability</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-2">
                  <button className="text-[#1a3a3a] hover:text-gray-700 font-medium text-xs sm:text-sm">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm">
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <button className="w-full mt-3 sm:mt-4 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-300 text-sm">
              <UserPlus className="w-4 sm:w-5 h-4 sm:h-5" />
              Add Friend
            </button>
          </div>
        </div>

        <button className="w-full mt-4 sm:mt-5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#f4a9a8] text-[#1a3a3a] font-semibold hover:bg-[#f5b9b8] transition-all flex items-center justify-center gap-2 text-sm">
          <UserPlus className="w-4 sm:w-5 h-4 sm:h-5" />
          Add New Pup
        </button>
      </div>
    </div>
  );
}