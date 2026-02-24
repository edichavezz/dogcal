'use client';

import CalendarView from '@/components/CalendarView';

type Hangout = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  ownerNotes?: string | null;
  eventName: string | null;
  seriesId?: string | null;
  seriesIndex?: number | null;
  pup: {
    id: string;
    name: string;
    careInstructions?: string | null;
    profilePhotoUrl?: string | null;
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
  notes?: Array<{
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
  };
  suggestedByFriend: {
    id: string;
    name: string;
  };
};

type PupInfo = {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
};

type CalendarClientProps = {
  hangouts: Hangout[];
  suggestions: Suggestion[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
  ownedPups?: PupInfo[];
  friendPups?: PupInfo[];
};

export default function CalendarClient({
  hangouts,
  suggestions,
  actingUserId,
  actingUserRole,
  ownedPups = [],
  friendPups = [],
}: CalendarClientProps) {
  return (
    <CalendarView
      hangouts={hangouts}
      suggestions={suggestions}
      actingUserId={actingUserId}
      actingUserRole={actingUserRole}
      ownedPups={ownedPups}
      friendPups={friendPups}
    />
  );
}
