'use client';

import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';

type LottieComponent = ComponentType<{
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  style?: CSSProperties;
}>;

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
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);
  const [animationData, setAnimationData] = useState<unknown | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import('lottie-react'),
      import('@/../dogcal-icons/Paws circular loader.json'),
    ]).then(([lottieModule, animationModule]) => {
      if (!isMounted) return;
      setLottie(() => lottieModule.default);
      setAnimationData(animationModule.default);
    }).catch((error) => {
      console.error('Failed to load paws animation:', error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const isReady = Lottie && animationData;

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={sizeMap[size]}>
        {isReady ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
        )}
      </div>
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
