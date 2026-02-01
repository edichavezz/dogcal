'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FaqField = {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
};

const FAQ_FIELDS: FaqField[] = [
  {
    key: 'about',
    label: 'About',
    icon: '🐕',
    placeholder: 'Personality, background, likes/dislikes...',
  },
  {
    key: 'food',
    label: 'Food',
    icon: '🍖',
    placeholder: 'Amounts, times, how to prep, any toppings...',
  },
  {
    key: 'treats',
    label: 'Treats',
    icon: '🦴',
    placeholder: 'When to give treats, what kind, any restrictions...',
  },
  {
    key: 'walks',
    label: 'Walks',
    icon: '🚶',
    placeholder: 'How often, how long, favorite routes, off/on-lead...',
  },
  {
    key: 'leash',
    label: 'Leash',
    icon: '🦮',
    placeholder: 'Heel vs free walk, crossing roads, on/off behavior...',
  },
  {
    key: 'socialising',
    label: 'Socialising',
    icon: '👋',
    placeholder: 'How they are with other dogs, children, new people...',
  },
  {
    key: 'tricks',
    label: 'Tricks',
    icon: '🎯',
    placeholder: 'Commands they know, training in progress...',
  },
  {
    key: 'play',
    label: 'Play',
    icon: '🎾',
    placeholder: 'Favorite toys, games, how they like to be entertained...',
  },
];

type PupFaqFormProps = {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
};

export default function PupFaqForm({
  values,
  onChange,
  disabled = false,
}: PupFaqFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(FAQ_FIELDS.filter((f) => values[f.key]).map((f) => f.key))
  );

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(FAQ_FIELDS.map((f) => f.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 mb-2">
        <button
          type="button"
          onClick={expandAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Expand all
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Collapse all
        </button>
      </div>

      {FAQ_FIELDS.map((field) => {
        const isExpanded = expandedSections.has(field.key);
        const hasContent = Boolean(values[field.key]);

        return (
          <div
            key={field.key}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(field.key)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                hasContent
                  ? 'bg-[#ffd4d4]/50 hover:bg-[#ffd4d4]/70'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-gray-800">
                <span>{field.icon}</span>
                {field.label}
                {hasContent && (
                  <span className="text-xs text-[#1a3a3a] bg-[#1a3a3a]/10 px-2 py-0.5 rounded-full">
                    filled
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="px-4 py-3 bg-white">
                <textarea
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={disabled}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4a9a8] min-h-[100px] resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { FAQ_FIELDS };
