'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

type Photo = { src: string; alt: string };

const INTERVAL_MS = 4500;

export default function PupPhotoCarousel({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  if (photos.length === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-slate-100"
      style={{ aspectRatio: '4 / 3' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={i < 3}
          />
        </div>
      ))}

      {/* Gradient overlay for controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Caption */}
      <p className="absolute bottom-10 left-0 right-0 text-center text-white/80 text-xs font-medium px-4 drop-shadow pointer-events-none">
        {photos[current].alt}
      </p>

      {/* Dot navigation */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to photo ${i + 1}`}
            className="pointer-events-auto"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
