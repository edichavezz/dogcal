'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type FaqItem = {
  key: string;
  label: string;
  icon: string;
  content: string | null;
};

type PupFaqSectionProps = {
  items: FaqItem[];
  defaultExpanded?: boolean;
};

export default function PupFaqSection({
  items,
  defaultExpanded = true,
}: PupFaqSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    defaultExpanded ? new Set(items.filter((i) => i.content).map((i) => i.key)) : new Set()
  );

  const filledItems = items.filter((item) => item.content);

  if (filledItems.length === 0) {
    return null;
  }

  const toggleItem = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-2">
      {filledItems.map((item) => (
        <div
          key={item.key}
          className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleItem(item.key)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/40 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-800">
              <span>{item.icon}</span>
              {item.label}
            </span>
            {expandedItems.has(item.key) ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expandedItems.has(item.key) && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper to build FAQ items from pup data
export function buildFaqItems(pup: {
  about?: string | null;
  food?: string | null;
  treats?: string | null;
  walks?: string | null;
  leash?: string | null;
  socialising?: string | null;
  tricks?: string | null;
  play?: string | null;
  careInstructions?: string | null;
}): FaqItem[] {
  const items: FaqItem[] = [
    { key: 'about', label: 'About', icon: '🐕', content: pup.about || null },
    { key: 'food', label: 'Food', icon: '🍖', content: pup.food || null },
    { key: 'treats', label: 'Treats', icon: '🦴', content: pup.treats || null },
    { key: 'walks', label: 'Walks', icon: '🚶', content: pup.walks || null },
    { key: 'leash', label: 'Leash', icon: '🦮', content: pup.leash || null },
    { key: 'socialising', label: 'Socialising', icon: '👋', content: pup.socialising || null },
    { key: 'tricks', label: 'Tricks', icon: '🎯', content: pup.tricks || null },
    { key: 'play', label: 'Play', icon: '🎾', content: pup.play || null },
  ];

  // Add legacy careInstructions as fallback if no FAQ items are filled
  if (pup.careInstructions && !items.some((i) => i.content)) {
    items.unshift({
      key: 'careInstructions',
      label: 'Care Instructions',
      icon: '📋',
      content: pup.careInstructions,
    });
  }

  return items;
}
