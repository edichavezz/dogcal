// Manage Page - Server Component
// For owners: Shows owner profile, pups, and friends
// For friends: Shows friend profile and pups they know

import { redirect } from 'next/navigation';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import AppLayout from '@/components/AppLayout';
import ManageClient from './ManageClient';

export default async function ManagePage() {
  const actingUserId = await getActingUserId();
  if (!actingUserId) {
    redirect('/');
  }

  // Fetch user with full details
  const user = await prisma.user.findUnique({
    where: { id: actingUserId },
    include: {
      ownedPups: {
        include: {
          friendships: {
            include: {
              friend: {
                select: {
                  id: true,
                  name: true,
                  profilePhotoUrl: true,
                  calendarColor: true,
                },
              },
            },
          },
        },
      },
      pupFriendships: {
        include: {
          pup: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  addressText: true,
                  phoneNumber: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/');
  }

  // Fetch all friend users for the "add friend" dropdown (owners only)
  const allFriends = user.role === 'OWNER'
    ? await prisma.user.findMany({
        where: { role: 'FRIEND' },
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
          calendarColor: true,
        },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <AppLayout user={user}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ManageClient user={user} allFriends={allFriends} />
      </div>
    </AppLayout>
  );
}
