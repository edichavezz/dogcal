'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Lightbulb } from 'lucide-react';
import PupFriendsList from './PupFriendsList';

export type PupCardData = {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
  owner?: {
    id: string;
    name: string;
  };
  friends?: Array<{ id: string; name: string; profilePhotoUrl: string | null }>;
};

type PupActionCardProps = {
  pup: PupCardData;
  isOwner: boolean;
  ownerName?: string;
};

export default function PupActionCard({ pup, isOwner, ownerName }: PupActionCardProps) {
  const href = isOwner
    ? `/hangouts/new?pupId=${pup.id}`
    : `/suggest?pupId=${pup.id}`;

  const actionLabel = isOwner ? 'Create Hangout' : 'Suggest Hangout';
  const ActionIcon = isOwner ? Plus : Lightbulb;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300"
    >
      {/* Pup Photo */}
      <div className="aspect-square bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] relative overflow-hidden">
        {pup.profilePhotoUrl ? (
          <Image
            src={pup.profilePhotoUrl}
            alt={pup.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">
            🐕
          </div>
        )}

        {/* Hover overlay with action */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-sm font-medium text-gray-900">
            <ActionIcon className="w-4 h-4" />
            <span>{actionLabel}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
          {pup.name}
        </h3>
        {!isOwner && ownerName && (
          <p className="text-xs text-gray-500 truncate">Owner: {ownerName}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg px-2 py-1.5">
          <ActionIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{actionLabel}</span>
        </div>
        {pup.friends && pup.friends.length > 0 && (
          <PupFriendsList friends={pup.friends} pupName={pup.name} />
        )}
      </div>
    </Link>
  );
}
