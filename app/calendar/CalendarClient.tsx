'use client';

import { useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

type Hangout = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  ownerNotes?: string | null;
  eventName: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    careInstructions?: string | null;
    owner: {
      id: string;
      name: string;
    };
  };
  assignedFriend?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  } | null;
  notes: Array<{
    id: string;
    noteText: string;
    createdAt: Date;
    author: {
      name: string;
    };
  }>;
};

type Suggestion = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  friendComment?: string | null;
  pup: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    owner: {
      id: string;
      name: string;
    };
  };
  suggestedByFriend: {
    id: string;
    name: string;
  };
};

type CalendarClientProps = {
  hangouts: Hangout[];
  suggestions: Suggestion[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
};

export default function CalendarClient({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
}: CalendarClientProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <CalendarView
      hangouts={hangouts}
      suggestions={suggestions}
      actingUserId={actingUserId}
      actingUserRole={actingUserRole}
      onUpdate={handleUpdate}
    />
  );
}
