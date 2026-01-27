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
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
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
