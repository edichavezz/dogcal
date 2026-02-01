'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

type Photo = {
  id: string;
  photoUrl: string;
  caption?: string | null;
};

type PhotoLightboxProps = {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: PhotoLightboxProps) {
  const photo = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      }
    },
    [onClose, onPrevious, onNext, hasPrevious, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {hasPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors z-10"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors z-10"
          aria-label="Next photo"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      {/* Photo */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={photo.photoUrl}
            alt={photo.caption || 'Gallery photo'}
            width={1200}
            height={800}
            className="max-w-full max-h-[80vh] object-contain"
            priority
          />
        </div>

        {/* Caption and counter */}
        <div className="mt-4 text-center">
          {photo.caption && (
            <p className="text-white text-lg mb-2">{photo.caption}</p>
          )}
          <p className="text-white/60 text-sm">
            {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </div>
    </div>
  );
}
