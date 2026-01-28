import DogPawLoader from '@/components/ui/DogPawLoader';

export default function CalendarLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Skeleton for TopNav */}
      <div className="h-16 bg-white border-b border-slate-200 animate-pulse" />

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
          </div>

          <div className="flex-1 min-h-0">
            <div className="h-full flex flex-col">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <DogPawLoader size={200} />
                    <p className="mt-4 text-slate-600 font-medium">Loading calendar...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
