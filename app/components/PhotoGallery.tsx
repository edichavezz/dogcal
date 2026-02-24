'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import PhotoLightbox from './PhotoLightbox';

type Photo = {
  id: string;
  photoUrl: string;
  caption?: string | null;
};

type PhotoGalleryProps = {
  photos: Photo[];
  canEdit: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (photoId: string) => Promise<void>;
  cacheKey?: string | number;
};

export default function PhotoGallery({
  photos,
  canEdit,
  onUpload,
  onDelete,
  cacheKey,
}: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!onDelete || deletingId) return;

    if (!confirm('Delete this photo?')) return;

    setDeletingId(photoId);
    try {
      await onDelete(photoId);
    } finally {
      setDeletingId(null);
    }
  };

  const getPhotoUrl = (url: string) => {
    return cacheKey ? `${url}?v=${cacheKey}` : url;
  };

  if (photos.length === 0 && !canEdit) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Photo Gallery</h4>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setLightboxIndex(index)}
          >
            <Image
              src={getPhotoUrl(photo.photoUrl)}
              alt={photo.caption || 'Gallery photo'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 33vw, 25vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Delete button for owners */}
            {canEdit && onDelete && (
              <button
                onClick={(e) => handleDelete(e, photo.id)}
                disabled={deletingId === photo.id}
                className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                aria-label="Delete photo"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        ))}

        {/* Upload button for owners */}
        {canEdit && onUpload && (
          <label
            className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#f4a9a8] hover:bg-[#ffd4d4]/20 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Add</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p) => ({ ...p, photoUrl: getPhotoUrl(p.photoUrl) }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() =>
            setLightboxIndex((i) => Math.min(photos.length - 1, (i ?? 0) + 1))
          }
        />
      )}
    </div>
  );
}
