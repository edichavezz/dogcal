'use client';

import Image from 'next/image';

type AvatarProps = {
  photoUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

export default function Avatar({
  photoUrl,
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const sizePixels = {
    xs: 32,
    sm: 48,
    md: 64,
    lg: 96,
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-yellow-200 to-orange-200 border-2 border-gray-200 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-gray-600">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
