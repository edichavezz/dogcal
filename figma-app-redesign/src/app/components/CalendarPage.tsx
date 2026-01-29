import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  
  const days = ['Sun 1/25', 'Mon 1/26', 'Tue 1/27', 'Wed 1/28', 'Thu 1/29', 'Fri 1/30', 'Sat 1/31'];
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];

  const events = [
    { day: 3, hour: 2, duration: 1, title: 'Walk - Max', subtitle: 'Morning Walk', color: 'from-[#b8d4ff] to-[#c8e0ff] border-blue-300', hasPerson: true },
    { day: 3, hour: 5, duration: 2, title: 'Playdate - Max & Buddy', subtitle: 'Park Hangout', color: 'from-[#ffd4a9] to-[#ffe4c4] border-orange-300', hasPerson: false },
    { day: 4, hour: 3, duration: 1, title: 'Grooming - Max', subtitle: 'Spa Day', color: 'from-[#e4c4f1] to-[#f0daf5] border-purple-300', hasPerson: true },
    { day: 5, hour: 1, duration: 2, title: 'Training Session', subtitle: 'Obedience Class', color: 'from-[#c4f1be] to-[#daf5d7] border-green-300', hasPerson: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 pt-20 lg:pt-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Calendar</h1>
        <p className="text-sm sm:text-base text-gray-600">View and manage hangouts for your pups</p>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl border border-gray-300 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#1a3a3a] text-white text-xs sm:text-sm font-medium hover:bg-[#2a4a4a] transition-colors">
                Today
              </button>
              <button className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl border border-gray-300 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
            </div>

            <div className="text-base sm:text-xl font-semibold text-gray-900">
              January 25 – 31, 2026
            </div>

            <div className="flex gap-1 bg-gray-200 rounded-lg sm:rounded-xl p-1">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all",
                  viewMode === 'week'
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all",
                  viewMode === 'day'
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                list
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px] sm:min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[70px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
              <div className="p-2 sm:p-4"></div>
              {days.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 sm:p-4 text-center text-xs sm:text-sm font-semibold border-l border-gray-200",
                    index === 3 ? "text-gray-900 bg-[#ffd4d4]/30" : "text-gray-700"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="relative">
              {hours.map((hour, hourIndex) => (
                <div key={hourIndex} className="grid grid-cols-[70px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b border-gray-200">
                  <div className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium bg-gray-50">
                    {hour}
                  </div>
                  {days.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={cn(
                        "border-l border-gray-200 min-h-[60px] sm:min-h-[80px] hover:bg-gray-50/50 transition-colors cursor-pointer relative",
                        dayIndex === 3 ? "bg-[#ffd4d4]/10" : "bg-white"
                      )}
                    >
                      {/* Events */}
                      {events.map((event, eventIndex) => {
                        if (event.day === dayIndex && event.hour === hourIndex) {
                          return (
                            <div
                              key={eventIndex}
                              className={cn(
                                "absolute inset-x-1 top-1 p-2 sm:p-3 rounded-lg sm:rounded-2xl shadow-sm border",
                                `bg-gradient-to-br ${event.color}`,
                                event.duration === 2 ? "h-[calc(200%-0.25rem)]" : ""
                              )}
                              style={{ zIndex: 10 }}
                            >
                              <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">
                                {event.title}
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-700 hidden sm:block">
                                {event.subtitle}
                              </div>
                              <div className="flex gap-1 mt-1 sm:mt-2">
                                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white/80 flex items-center justify-center text-xs">
                                  🐕
                                </div>
                                {event.hasPerson && (
                                  <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white/80 flex items-center justify-center text-xs">
                                    👤
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}