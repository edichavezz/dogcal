'use client';

import { useState, useEffect } from 'react';
import { X, Camera, Phone, Edit2, Save, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Avatar from './Avatar';
import PupFaqSection, { buildFaqItems } from './PupFaqSection';
import PupFaqForm, { FAQ_FIELDS } from './PupFaqForm';
import PhotoGallery from './PhotoGallery';

type PupPhoto = {
  id: string;
  photoUrl: string;
  caption?: string | null;
};

type PupOwner = {
  id: string;
  name: string;
  phoneNumber?: string | null;
  profilePhotoUrl?: string | null;
};

type PupData = {
  id: string;
  name: string;
  breed?: string | null;
  profilePhotoUrl?: string | null;
  careInstructions?: string | null;
  about?: string | null;
  food?: string | null;
  treats?: string | null;
  walks?: string | null;
  leash?: string | null;
  socialising?: string | null;
  tricks?: string | null;
  play?: string | null;
  photos?: PupPhoto[];
  owner?: PupOwner;
  ownerUserId: string;
};

type PupInfoModalProps = {
  pup: PupData;
  isOwner: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PupData>) => Promise<void>;
  onPhotoUpload: (file: File) => Promise<void>;
  onGalleryUpload: (file: File) => Promise<void>;
  onGalleryDelete: (photoId: string) => Promise<void>;
  cacheKey?: number;
};

export default function PupInfoModal({
  pup,
  isOwner,
  onClose,
  onUpdate,
  onPhotoUpload,
  onGalleryUpload,
  onGalleryDelete,
  cacheKey,
}: PupInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pupName, setPupName] = useState(pup.name);
  const [pupBreed, setPupBreed] = useState(pup.breed || '');
  const [faqValues, setFaqValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    FAQ_FIELDS.forEach((field) => {
      values[field.key] = (pup as Record<string, unknown>)[field.key] as string || '';
    });
    return values;
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<PupData> = {
        name: pupName,
        breed: pupBreed || null,
      };
      FAQ_FIELDS.forEach((field) => {
        (updates as Record<string, string | null>)[field.key] = faqValues[field.key] || null;
      });
      await onUpdate(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFaqChange = (key: string, value: string) => {
    setFaqValues((prev) => ({ ...prev, [key]: value }));
  };

  const faqItems = buildFaqItems(pup);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with photo */}
        <div className="relative bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-start gap-4">
            {/* Profile photo */}
            <div className="relative group flex-shrink-0">
              {pup.profilePhotoUrl ? (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden">
                  <Image
                    src={cacheKey ? `${pup.profilePhotoUrl}?v=${cacheKey}` : pup.profilePhotoUrl}
                    alt={pup.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#f4a9a8] flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-semibold text-[#1a3a3a]">
                    {pup.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Photo upload overlay for owners */}
              {isOwner && (
                <label className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onPhotoUpload(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Name and breed */}
            <div className="flex-1 min-w-0 pt-2">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={pupName}
                    onChange={(e) => setPupName(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                  <input
                    type="text"
                    value={pupBreed}
                    onChange={(e) => setPupBreed(e.target.value)}
                    placeholder="Breed (optional)"
                    className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#f4a9a8]"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {pup.name}
                  </h2>
                  {pup.breed && (
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{pup.breed}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Edit button for owners */}
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Owner info for friends */}
          {!isOwner && pup.owner && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Owner</h4>
              <div className="flex items-center gap-3">
                <Avatar
                  photoUrl={pup.owner.profilePhotoUrl}
                  name={pup.owner.name}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900">{pup.owner.name}</p>
                  {pup.owner.phoneNumber && (
                    <a
                      href={`tel:${pup.owner.phoneNumber}`}
                      className="flex items-center gap-1.5 text-sm text-[#1a3a3a] hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {pup.owner.phoneNumber}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FAQ section */}
          {isEditing ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Care Information</h4>
              <PupFaqForm
                values={faqValues}
                onChange={handleFaqChange}
                disabled={saving}
              />
            </div>
          ) : (
            faqItems.some((i) => i.content) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Care Information</h4>
                <PupFaqSection items={faqItems} />
              </div>
            )
          )}

          {/* Photo gallery */}
          {(pup.photos && pup.photos.length > 0) || isOwner ? (
            <PhotoGallery
              photos={pup.photos || []}
              canEdit={isOwner}
              onUpload={onGalleryUpload}
              onDelete={onGalleryDelete}
              cacheKey={cacheKey}
            />
          ) : null}
        </div>

        {/* Footer with save button when editing */}
        {isEditing && (
          <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={() => {
                setIsEditing(false);
                setPupName(pup.name);
                setPupBreed(pup.breed || '');
                const resetValues: Record<string, string> = {};
                FAQ_FIELDS.forEach((field) => {
                  resetValues[field.key] = (pup as Record<string, unknown>)[field.key] as string || '';
                });
                setFaqValues(resetValues);
              }}
              disabled={saving}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !pupName.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-[#1a3a3a] text-white rounded-lg font-medium hover:bg-[#2a4a4a] disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
