'use client';

import Image from 'next/image';

type AvatarProps = {
  photoUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
};

export default function Avatar({
  photoUrl,
  name,
  size = 'md',
  className = '',
  style,
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const sizePixels = {
    xs: 24,
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#f4a9a8] flex items-center justify-center flex-shrink-0 ${className}`}
      style={style}
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
        <span className="font-semibold text-[#1a3a3a]">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
