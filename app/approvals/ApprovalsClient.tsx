'use client';

import { useRouter } from 'next/navigation';
import SuggestionCard from '@/components/SuggestionCard';

type Suggestion = {
  id: string;
  startAt: Date;
  endAt: Date;
  friendComment?: string | null;
  pup: {
    name: string;
    profilePhotoUrl?: string | null;
  };
  suggestedByFriend: {
    name: string;
  };
};

type ApprovalsClientProps = {
  suggestions: Suggestion[];
};

export default function ApprovalsClient({ suggestions }: ApprovalsClientProps) {
  const router = useRouter();

  const handleDecision = () => {
    // Refresh the page to show updated suggestions
    router.refresh();
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#ffd4d4] to-[#ffe4d4] rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          All caught up!
        </h2>
        <p className="text-gray-600">
          You don&apos;t have any pending suggestions to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={{
            ...suggestion,
            startAt: suggestion.startAt.toISOString(),
            endAt: suggestion.endAt.toISOString(),
          }}
          onDecision={handleDecision}
        />
      ))}
    </div>
  );
}
