/**
 * Reset Development Database
 *
 * This script:
 * 1. Deletes all data from the database
 * 2. Seeds with minimal demo data for development
 * 3. Includes test phone number for WhatsApp testing
 *
 * Usage: npm run db:reset
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing development database...\n');

  // Delete all data in reverse order of dependencies
  await prisma.hangoutNote.deleteMany();
  await prisma.hangoutSuggestion.deleteMany();
  await prisma.hangout.deleteMany();
  await prisma.pupFriendship.deleteMany();
  await prisma.pup.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared\n');
  console.log('🌱 Seeding development database...\n');

  // Create Owners
  const edi = await prisma.user.create({
    data: {
      name: 'Edi & Tom',
      role: 'OWNER',
      phoneNumber: '+447476238512', // Your test number
      address: '123 Demo Street, London',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah',
      role: 'OWNER',
      address: '456 Park Avenue, London',
    },
  });

  console.log('✅ Created 2 owners');

  // Create Pups
  const max = await prisma.pup.create({
    data: {
      name: 'Max',
      breed: 'Golden Retriever',
      ownerUserId: edi.id,
      careInstructions: 'Needs 2 walks daily, loves treats!',
    },
  });

  const luna = await prisma.pup.create({
    data: {
      name: 'Luna',
      breed: 'Border Collie',
      ownerUserId: sarah.id,
      careInstructions: 'Very energetic, needs lots of exercise',
    },
  });

  console.log('✅ Created 2 pups');

  // Create Friends
  const alex = await prisma.user.create({
    data: {
      name: 'Alex',
      role: 'FRIEND',
      phoneNumber: '+447476238512', // Your test number
      address: '789 Oak Road, London',
    },
  });

  const jamie = await prisma.user.create({
    data: {
      name: 'Jamie',
      role: 'FRIEND',
      address: '321 Maple Street, London',
    },
  });

  console.log('✅ Created 2 friends');

  // Create Friendships
  await prisma.pupFriendship.create({
    data: {
      pupId: max.id,
      friendUserId: alex.id,
      historyWithPup: 'Friends for 2 years, very experienced',
    },
  });

  await prisma.pupFriendship.create({
    data: {
      pupId: max.id,
      friendUserId: jamie.id,
      historyWithPup: 'New friend, learning the ropes',
    },
  });

  await prisma.pupFriendship.create({
    data: {
      pupId: luna.id,
      friendUserId: alex.id,
      historyWithPup: 'Met at the dog park, great bond',
    },
  });

  console.log('✅ Created 3 friendships');

  // Create some demo hangouts (upcoming and past)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(16, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(12, 0, 0, 0);

  // Open hangout (needs assignment)
  await prisma.hangout.create({
    data: {
      pupId: max.id,
      startAt: tomorrow,
      endAt: tomorrowEnd,
      status: 'OPEN',
      createdByOwnerUserId: edi.id,
      eventName: 'Morning Walk',
      ownerNotes: 'Please bring treats!',
    },
  });

  // Assigned hangout (upcoming)
  await prisma.hangout.create({
    data: {
      pupId: luna.id,
      startAt: nextWeek,
      endAt: nextWeekEnd,
      status: 'ASSIGNED',
      createdByOwnerUserId: sarah.id,
      assignedFriendUserId: alex.id,
      eventName: 'Afternoon Playdate',
      ownerNotes: 'She loves the frisbee',
    },
  });

  // Completed hangout (past)
  await prisma.hangout.create({
    data: {
      pupId: max.id,
      startAt: yesterday,
      endAt: yesterdayEnd,
      status: 'COMPLETED',
      createdByOwnerUserId: edi.id,
      assignedFriendUserId: jamie.id,
      eventName: 'Morning Walk',
    },
  });

  console.log('✅ Created 3 hangouts (1 open, 1 assigned, 1 completed)');

  // Create a pending suggestion
  const suggestionDate = new Date();
  suggestionDate.setDate(suggestionDate.getDate() + 3);
  suggestionDate.setHours(15, 0, 0, 0);

  const suggestionEnd = new Date(suggestionDate);
  suggestionEnd.setHours(17, 0, 0, 0);

  await prisma.hangoutSuggestion.create({
    data: {
      pupId: luna.id,
      suggestedByFriendUserId: alex.id,
      startAt: suggestionDate,
      endAt: suggestionEnd,
      status: 'PENDING',
      eventName: 'Park Visit',
      friendComment: 'I can take Luna to the big park this day!',
    },
  });

  console.log('✅ Created 1 pending suggestion');

  console.log('\n📊 Development Database Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Users: ${await prisma.user.count()}`);
  console.log(`   • Owners: ${await prisma.user.count({ where: { role: 'OWNER' } })}`);
  console.log(`   • Friends: ${await prisma.user.count({ where: { role: 'FRIEND' } })}`);
  console.log(`🐕 Pups: ${await prisma.pup.count()}`);
  console.log(`🤝 Friendships: ${await prisma.pupFriendship.count()}`);
  console.log(`📅 Hangouts: ${await prisma.hangout.count()}`);
  console.log(`💡 Suggestions: ${await prisma.hangoutSuggestion.count()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n🔑 Login Tokens:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const users = await prisma.user.findMany({
    select: { name: true, role: true, phoneNumber: true },
  });

  for (const user of users) {
    const phone = user.phoneNumber ? ` (📱 ${user.phoneNumber})` : '';
    console.log(`   • ${user.name} (${user.role})${phone}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n✨ Development database ready!');
  console.log('\n📝 Next steps:');
  console.log('   1. Generate login tokens: npm run dev');
  console.log('   2. Go to: http://localhost:3000/admin?token=admin-secret-token-change-in-production');
  console.log('   3. Click "Generate Tokens" to create login URLs');
  console.log('\n💬 WhatsApp testing available for users with +447476238512\n');
}

main()
  .catch((e) => {
    console.error('❌ Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
