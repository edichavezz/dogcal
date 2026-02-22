type TabPageSkeletonProps = {
  titleWidth?: string;
  subtitleWidth?: string;
  blocks?: number;
};

export default function TabPageSkeleton({
  titleWidth = 'w-40',
  subtitleWidth = 'w-72',
  blocks = 3,
}: TabPageSkeletonProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden lg:flex w-64 bg-[#1a3a3a] min-h-screen flex-col flex-shrink-0">
        <div className="p-6 border-b border-[#2a4a4a]">
          <div className="h-8 w-28 bg-[#2a4a4a] rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`nav-${i}`} className="h-11 bg-[#2a4a4a] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="p-4 border-t border-[#2a4a4a]">
          <div className="h-14 bg-[#2a4a4a] rounded-xl animate-pulse" />
        </div>
      </aside>

      {/* Mobile top and bottom nav skeleton */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1a3a3a] border-b border-[#2a4a4a] z-50" />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1a3a3a] border-t border-[#2a4a4a] z-50" />

      <main className="flex-1 h-full overflow-hidden">
        <div className="pt-16 pb-20 lg:pt-0 lg:pb-0 h-full overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className={`h-8 ${titleWidth} bg-slate-200 rounded animate-pulse mb-3`} />
            <div className={`h-4 ${subtitleWidth} bg-slate-100 rounded animate-pulse mb-6`} />
            <div className="space-y-4">
              {Array.from({ length: blocks }).map((_, i) => (
                <div key={`block-${i}`} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
