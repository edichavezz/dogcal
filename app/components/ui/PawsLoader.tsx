'use client';

import Lottie from 'lottie-react';
import pawsLoaderAnimation from '@/../dogcal-icons/Paws circular loader.json';

type PawsLoaderProps = {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
};

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

export default function PawsLoader({ size = 'md', message, className = '' }: PawsLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={sizeMap[size]}>
        <Lottie
          animationData={pawsLoaderAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
