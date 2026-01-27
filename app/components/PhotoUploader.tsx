'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type PhotoUploaderProps = {
  currentPhotoUrl?: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  label: string;
  size?: 'small' | 'medium' | 'large';
};

export default function PhotoUploader({
  currentPhotoUrl,
  onPhotoChange,
  label,
  size = 'medium',
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  const sizePixels = {
    small: 80,
    medium: 128,
    large: 192,
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onPhotoChange(data.photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center gap-4">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300 flex items-center justify-center flex-shrink-0`}
        >
          {currentPhotoUrl ? (
            <Image
              src={currentPhotoUrl}
              alt={label}
              width={sizePixels[size]}
              height={sizePixels[size]}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-gray-400">🐾</span>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-md hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 transition-all"
          >
            {uploading
              ? 'Uploading...'
              : currentPhotoUrl
              ? 'Change Photo'
              : 'Upload Photo'}
          </button>

          {currentPhotoUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="ml-2 px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 disabled:opacity-50 transition-all"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
