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
    careInstructions?: string | null;
    owner: {
      id: string;
      name: string;
    };
  };
  assignedFriend?: {
    id: string;
    name: string;
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

type CalendarClientProps = {
  hangouts: Hangout[];
  actingUserId: string;
  actingUserRole: 'OWNER' | 'FRIEND';
};

export default function CalendarClient({
  hangouts,
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
      actingUserId={actingUserId}
      actingUserRole={actingUserRole}
      onUpdate={handleUpdate}
    />
  );
}
