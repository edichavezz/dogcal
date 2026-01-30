'use client';

import PawsLoader from './PawsLoader';

type CalendarSkeletonProps = {
  message?: string;
};

export default function CalendarSkeleton({
  message = 'Loading calendar...'
}: CalendarSkeletonProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
          <PawsLoader size="lg" message={message} />
        </div>
      </div>
    </div>
  );
}
