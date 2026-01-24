import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.hangoutNote.deleteMany();
  await prisma.hangoutSuggestion.deleteMany();
  await prisma.hangout.deleteMany();
  await prisma.pupFriendship.deleteMany();
  await prisma.pup.deleteMany();
  await prisma.user.deleteMany();

  // Create Users - Owners
  const owner1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      addressText: '123 Oak Street, San Francisco, CA',
      role: 'OWNER',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      name: 'Michael Chen',
      addressText: '456 Pine Avenue, Oakland, CA',
      role: 'OWNER',
    },
  });

  // Create Users - Friends
  const friend1 = await prisma.user.create({
    data: {
      name: 'Emma Davis',
      addressText: '789 Maple Drive, Berkeley, CA',
      role: 'FRIEND',
    },
  });

  const friend2 = await prisma.user.create({
    data: {
      name: 'Alex Rodriguez',
      addressText: '321 Birch Lane, San Francisco, CA',
      role: 'FRIEND',
    },
  });

  const friend3 = await prisma.user.create({
    data: {
      name: 'Jamie Williams',
      addressText: '654 Cedar Court, Oakland, CA',
      role: 'FRIEND',
    },
  });

  console.log('✅ Created 5 users (2 owners, 3 friends)');

  // Create Pups
  const pup1 = await prisma.pup.create({
    data: {
      name: 'Max',
      ownerUserId: owner1.id,
      careInstructions: 'Max loves to play fetch! Feed him at 8am and 6pm. He needs a 30-minute walk twice daily.',
    },
  });

  const pup2 = await prisma.pup.create({
    data: {
      name: 'Luna',
      ownerUserId: owner1.id,
      careInstructions: 'Luna is shy at first but warms up quickly. She prefers quiet environments and gentle play.',
    },
  });

  const pup3 = await prisma.pup.create({
    data: {
      name: 'Charlie',
      ownerUserId: owner2.id,
      careInstructions: 'Charlie is very energetic! He needs lots of exercise and mental stimulation. Feed at noon.',
    },
  });

  console.log('✅ Created 3 pups');

  // Create PupFriendships
  await prisma.pupFriendship.createMany({
    data: [
      {
        pupId: pup1.id,
        friendUserId: friend1.id,
        historyWithPup: "I've been watching Max for 2 years. He's like my own dog!",
      },
      {
        pupId: pup1.id,
        friendUserId: friend2.id,
        historyWithPup: 'Max and I go on adventures to the beach together.',
      },
      {
        pupId: pup2.id,
        friendUserId: friend1.id,
        historyWithPup: 'Luna loves our cozy movie nights together.',
      },
      {
        pupId: pup2.id,
        friendUserId: friend3.id,
        historyWithPup: 'Luna and I bonded over calm walks in the park.',
      },
      {
        pupId: pup3.id,
        friendUserId: friend2.id,
        historyWithPup: 'Charlie is my running buddy! We do 5k runs together.',
      },
      {
        pupId: pup3.id,
        friendUserId: friend3.id,
        historyWithPup: 'Charlie keeps me active and happy!',
      },
    ],
  });

  console.log('✅ Created 6 pup friendships');

  // Create Hangouts
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const _hangout1 = await prisma.hangout.create({
    data: {
      pupId: pup1.id,
      startAt: tomorrow.toISOString(),
      endAt: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'OPEN',
      createdByOwnerUserId: owner1.id,
      ownerNotes: 'Morning walk needed! Max ate breakfast already.',
    },
  });

  const hangout2 = await prisma.hangout.create({
    data: {
      pupId: pup2.id,
      startAt: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      status: 'ASSIGNED',
      assignedFriendUserId: friend1.id,
      createdByOwnerUserId: owner1.id,
      ownerNotes: 'Luna needs her medication at 3pm (will leave on counter).',
    },
  });

  const _hangout3 = await prisma.hangout.create({
    data: {
      pupId: pup3.id,
      startAt: nextWeek.toISOString(),
      endAt: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      status: 'OPEN',
      createdByOwnerUserId: owner2.id,
      ownerNotes: 'Charlie will need lunch at noon. Kibble is in the pantry.',
    },
  });

  const hangout4 = await prisma.hangout.create({
    data: {
      pupId: pup1.id,
      startAt: lastWeek.toISOString(),
      endAt: new Date(lastWeek.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED',
      assignedFriendUserId: friend2.id,
      createdByOwnerUserId: owner1.id,
      ownerNotes: 'Quick afternoon playdate.',
    },
  });

  console.log('✅ Created 4 hangouts (2 open, 1 assigned, 1 completed)');

  // Create Hangout Notes
  await prisma.hangoutNote.create({
    data: {
      hangoutId: hangout2.id,
      authorUserId: friend1.id,
      noteText: "Just arrived! Luna is happy to see me. We're settling in nicely. 🐕",
    },
  });

  await prisma.hangoutNote.create({
    data: {
      hangoutId: hangout2.id,
      authorUserId: owner1.id,
      noteText: 'Thank you so much Emma! She loves spending time with you.',
    },
  });

  await prisma.hangoutNote.create({
    data: {
      hangoutId: hangout4.id,
      authorUserId: friend2.id,
      noteText: 'Max had a blast at the dog park! He made lots of new friends.',
    },
  });

  console.log('✅ Created 3 hangout notes');

  // Create Hangout Suggestions
  await prisma.hangoutSuggestion.create({
    data: {
      pupId: pup3.id,
      suggestedByFriendUserId: friend2.id,
      startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      friendComment: "I'm free this Saturday morning! Would love to take Charlie for a run in Golden Gate Park.",
    },
  });

  await prisma.hangoutSuggestion.create({
    data: {
      pupId: pup1.id,
      suggestedByFriendUserId: friend1.id,
      startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      friendComment: 'I have Monday off and would love to spend the day with Max!',
    },
  });

  console.log('✅ Created 2 pending hangout suggestions');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 5 users (2 owners, 3 friends)');
  console.log('  - 3 pups');
  console.log('  - 6 pup friendships');
  console.log('  - 4 hangouts');
  console.log('  - 3 hangout notes');
  console.log('  - 2 pending suggestions');
  console.log('\n🧪 Test users:');
  console.log('  Owners: Sarah Johnson, Michael Chen');
  console.log('  Friends: Emma Davis, Alex Rodriguez, Jamie Williams');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
