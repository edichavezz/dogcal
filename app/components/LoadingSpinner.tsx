'use client';

import PawsLoader from './ui/PawsLoader';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 48, message, className = '' }: LoadingSpinnerProps) {
  // Map numeric size to PawsLoader size
  const pawsSize = size >= 64 ? 'lg' : size >= 32 ? 'md' : 'sm';

  return (
    <PawsLoader size={pawsSize} message={message} className={className} />
  );
}

export function CalendarSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <PawsLoader size="lg" message={message} />
    </div>
  );
}
