'use client';

import DogPawLoader from './DogPawLoader';

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
          <div className="text-center">
            <DogPawLoader size={180} />
            <p className="mt-4 text-slate-600 font-medium">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
