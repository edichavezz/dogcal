import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with custom data...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.hangoutNote.deleteMany();
  await prisma.hangoutSuggestion.deleteMany();
  await prisma.hangout.deleteMany();
  await prisma.pupFriendship.deleteMany();
  await prisma.pup.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Database cleaned');

  // Create Users - Owners
  console.log('👥 Creating owners...');

  const annabella = await prisma.user.create({
    data: {
      name: 'Annabella',
      addressText: '123 Maple Street',
      role: 'OWNER',
    },
  });
  console.log(`✓ Created owner: ${annabella.name}`);

  const autumn = await prisma.user.create({
    data: {
      name: 'Autumn',
      addressText: '456 Oak Avenue',
      role: 'OWNER',
    },
  });
  console.log(`✓ Created owner: ${autumn.name}`);

  const natalieJames = await prisma.user.create({
    data: {
      name: 'Natalie & James',
      addressText: '789 Pine Road',
      role: 'OWNER',
    },
  });
  console.log(`✓ Created owner: ${natalieJames.name}`);

  // Create Users - Friends
  console.log('🤝 Creating friends...');

  const edi = await prisma.user.create({
    data: {
      name: 'Edi',
      addressText: '101 Birch Lane',
      role: 'FRIEND',
    },
  });
  console.log(`✓ Created friend: ${edi.name}`);

  const natalie = await prisma.user.create({
    data: {
      name: 'Natalie',
      addressText: '202 Cedar Court',
      role: 'FRIEND',
    },
  });
  console.log(`✓ Created friend: ${natalie.name}`);

  const jacqui = await prisma.user.create({
    data: {
      name: 'Jacqui',
      addressText: '303 Willow Way',
      role: 'FRIEND',
    },
  });
  console.log(`✓ Created friend: ${jacqui.name}`);

  const beth = await prisma.user.create({
    data: {
      name: 'Beth',
      addressText: '404 Elm Street',
      role: 'FRIEND',
    },
  });
  console.log(`✓ Created friend: ${beth.name}`);

  // Create Pups
  console.log('🐕 Creating pups...');

  const zoro = await prisma.pup.create({
    data: {
      name: 'Zoro',
      ownerUserId: annabella.id,
      careInstructions: 'Loves to play fetch! Feed twice daily. Walks preferred in the morning.',
    },
  });
  console.log(`✓ Created pup: ${zoro.name} (owner: ${annabella.name})`);

  const navy = await prisma.pup.create({
    data: {
      name: 'Navy',
      ownerUserId: autumn.id,
      careInstructions: 'Very gentle and calm. Needs medication at 6pm. Enjoys quiet walks.',
    },
  });
  console.log(`✓ Created pup: ${navy.name} (owner: ${autumn.name})`);

  const mojo = await prisma.pup.create({
    data: {
      name: 'Mojo',
      ownerUserId: natalieJames.id,
      careInstructions: 'High energy! Needs lots of playtime. Food is in the blue container.',
    },
  });
  console.log(`✓ Created pup: ${mojo.name} (owner: ${natalieJames.name})`);

  // Create PupFriendships
  console.log('🔗 Creating friendships...');

  // Zoro's friends: Edi, Natalie, Jacqui, Beth
  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: edi.id,
      historyWithPup: 'Has been caring for Zoro for over a year. Very experienced!',
    },
  });
  console.log(`✓ ${edi.name} can care for ${zoro.name}`);

  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: natalie.id,
      historyWithPup: 'Zoro loves spending time with Natalie. Great walker!',
    },
  });
  console.log(`✓ ${natalie.name} can care for ${zoro.name}`);

  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: jacqui.id,
      historyWithPup: 'Recently started helping out. Zoro is warming up nicely.',
    },
  });
  console.log(`✓ ${jacqui.name} can care for ${zoro.name}`);

  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: beth.id,
      historyWithPup: 'Beth and Zoro have great playdates together!',
    },
  });
  console.log(`✓ ${beth.name} can care for ${zoro.name}`);

  // Navy's friends: Edi
  await prisma.pupFriendship.create({
    data: {
      pupId: navy.id,
      friendUserId: edi.id,
      historyWithPup: 'Edi is Navy\'s favorite person! Very gentle and caring.',
    },
  });
  console.log(`✓ ${edi.name} can care for ${navy.name}`);

  // Mojo's friends: Annabella, Edi
  await prisma.pupFriendship.create({
    data: {
      pupId: mojo.id,
      friendUserId: annabella.id,
      historyWithPup: 'Annabella and Mojo have tons of fun together. Great energy match!',
    },
  });
  console.log(`✓ ${annabella.name} can care for ${mojo.name}`);

  await prisma.pupFriendship.create({
    data: {
      pupId: mojo.id,
      friendUserId: edi.id,
      historyWithPup: 'Edi handles Mojo\'s high energy perfectly. Experienced with active pups!',
    },
  });
  console.log(`✓ ${edi.name} can care for ${mojo.name}`);

  console.log('\n✨ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Owners: ${annabella.name}, ${autumn.name}, ${natalieJames.name}`);
  console.log(`   Friends: ${edi.name}, ${natalie.name}, ${jacqui.name}, ${beth.name}`);
  console.log(`   Pups: ${zoro.name}, ${navy.name}, ${mojo.name}`);
  console.log(`   Friendships created: 7`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
