/**
 * Production & Development Seed Script
 *
 * Creates the real DogCal data:
 * - Owners with their pups
 * - Friends with pup friendships
 * - Recurring hangouts (Edi & Tom with Zoro)
 *
 * Usage:
 *   Development: npm run db:seed
 *   Production:  DATABASE_URL="<prod-url>" npm run db:seed:prod
 */

// Load environment variables BEFORE importing Prisma
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Initialize Supabase client for photo cleanup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const PHOTO_BUCKET = 'dogcal-photos';

async function clearPhotos() {
  if (!supabase) {
    console.log('⚠️  Supabase not configured, skipping photo cleanup');
    return;
  }

  try {
    console.log('🗑️  Clearing photos from Supabase storage...');

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .list('', { limit: 1000 });

    if (listError) {
      console.log(`⚠️  Could not list photos: ${listError.message}`);
      return;
    }

    if (files && files.length > 0) {
      // Get all file paths (including nested folders)
      const filePaths: string[] = [];

      for (const item of files) {
        if (item.id) {
          // It's a file
          filePaths.push(item.name);
        } else {
          // It's a folder, list its contents
          const { data: folderFiles } = await supabase.storage
            .from(PHOTO_BUCKET)
            .list(item.name, { limit: 1000 });

          if (folderFiles) {
            for (const file of folderFiles) {
              if (file.id) {
                filePaths.push(`${item.name}/${file.name}`);
              }
            }
          }
        }
      }

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove(filePaths);

        if (deleteError) {
          console.log(`⚠️  Could not delete some photos: ${deleteError.message}`);
        } else {
          console.log(`✅ Deleted ${filePaths.length} photos`);
        }
      } else {
        console.log('✅ No photos to delete');
      }
    } else {
      console.log('✅ No photos to delete');
    }
  } catch (error) {
    console.log(`⚠️  Photo cleanup error: ${error}`);
  }
}

async function main() {
  console.log('\n🐕 DogCal Production Seed Script');
  console.log('═'.repeat(50));

  // Clear photos first
  await clearPhotos();

  // Clear database
  console.log('\n🗑️  Clearing database...');
  await prisma.hangoutNote.deleteMany();
  await prisma.hangoutSuggestion.deleteMany();
  await prisma.hangout.deleteMany();
  await prisma.pupFriendship.deleteMany();
  await prisma.pup.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleared');

  // ============================================
  // CREATE OWNERS
  // ============================================
  console.log('\n👥 Creating owners...');

  const annabellaLuke = await prisma.user.create({
    data: {
      name: 'Annabella & Luke',
      role: 'OWNER',
    },
  });
  console.log(`   ✓ ${annabellaLuke.name}`);

  const eduardoMarina = await prisma.user.create({
    data: {
      name: 'Eduardo & Marina',
      role: 'OWNER',
    },
  });
  console.log(`   ✓ ${eduardoMarina.name}`);

  const autumn = await prisma.user.create({
    data: {
      name: 'Autumn',
      role: 'OWNER',
    },
  });
  console.log(`   ✓ ${autumn.name}`);

  const natalieJames = await prisma.user.create({
    data: {
      name: 'Natalie & James',
      role: 'OWNER',
    },
  });
  console.log(`   ✓ ${natalieJames.name}`);

  const richard = await prisma.user.create({
    data: {
      name: 'Richard',
      role: 'OWNER',
    },
  });
  console.log(`   ✓ ${richard.name}`);

  // ============================================
  // CREATE PUPS
  // ============================================
  console.log('\n🐕 Creating pups...');

  const zoro = await prisma.pup.create({
    data: {
      name: 'Zoro',
      breed: 'Havanese',
      ownerUserId: annabellaLuke.id,
    },
  });
  console.log(`   ✓ ${zoro.name} (${zoro.breed}) - Owner: ${annabellaLuke.name}`);

  const lorenzo = await prisma.pup.create({
    data: {
      name: 'Lorenzo',
      breed: 'Welsh Corgi',
      ownerUserId: eduardoMarina.id,
    },
  });
  console.log(`   ✓ ${lorenzo.name} (${lorenzo.breed}) - Owner: ${eduardoMarina.name}`);

  const navy = await prisma.pup.create({
    data: {
      name: 'Navy',
      breed: 'Working Labrador',
      ownerUserId: autumn.id,
    },
  });
  console.log(`   ✓ ${navy.name} (${navy.breed}) - Owner: ${autumn.name}`);

  const mojo = await prisma.pup.create({
    data: {
      name: 'Mojo',
      ownerUserId: natalieJames.id,
    },
  });
  console.log(`   ✓ ${mojo.name} - Owner: ${natalieJames.name}`);

  const indie = await prisma.pup.create({
    data: {
      name: 'Indie',
      ownerUserId: richard.id,
    },
  });
  console.log(`   ✓ ${indie.name} - Owner: ${richard.name}`);

  // ============================================
  // CREATE FRIENDS
  // ============================================
  console.log('\n🤝 Creating friends...');

  const ediTom = await prisma.user.create({
    data: {
      name: 'Edi & Tom',
      role: 'FRIEND',
    },
  });
  console.log(`   ✓ ${ediTom.name}`);

  const jacqui = await prisma.user.create({
    data: {
      name: 'Jacqui',
      role: 'FRIEND',
    },
  });
  console.log(`   ✓ ${jacqui.name}`);

  const vanessa = await prisma.user.create({
    data: {
      name: 'Vanessa',
      role: 'FRIEND',
    },
  });
  console.log(`   ✓ ${vanessa.name}`);

  const karmasMum = await prisma.user.create({
    data: {
      name: "Karma's mum",
      role: 'FRIEND',
    },
  });
  console.log(`   ✓ ${karmasMum.name}`);

  // ============================================
  // CREATE FRIENDSHIPS
  // ============================================
  console.log('\n🔗 Creating friendships...');

  // Edi & Tom's friendships (Zoro, Navy, Lorenzo, Mojo, Indie)
  const ediTomPups = [
    { pup: zoro, name: 'Zoro' },
    { pup: navy, name: 'Navy' },
    { pup: lorenzo, name: 'Lorenzo' },
    { pup: mojo, name: 'Mojo' },
    { pup: indie, name: 'Indie' },
  ];

  for (const { pup, name } of ediTomPups) {
    await prisma.pupFriendship.create({
      data: {
        pupId: pup.id,
        friendUserId: ediTom.id,
      },
    });
    console.log(`   ✓ ${ediTom.name} ↔ ${name}`);
  }

  // Jacqui's friendships (Zoro)
  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: jacqui.id,
    },
  });
  console.log(`   ✓ ${jacqui.name} ↔ Zoro`);

  // Vanessa's friendships (Zoro)
  await prisma.pupFriendship.create({
    data: {
      pupId: zoro.id,
      friendUserId: vanessa.id,
    },
  });
  console.log(`   ✓ ${vanessa.name} ↔ Zoro`);

  // Karma's mum's friendships (Navy)
  await prisma.pupFriendship.create({
    data: {
      pupId: navy.id,
      friendUserId: karmasMum.id,
    },
  });
  console.log(`   ✓ ${karmasMum.name} ↔ Navy`);

  // ============================================
  // CREATE RECURRING HANGOUTS
  // ============================================
  console.log('\n📅 Creating recurring hangouts...');

  // Helper to get next occurrence of a day of week
  function getNextDayOfWeek(dayOfWeek: number, afterDate: Date = new Date()): Date {
    const result = new Date(afterDate);
    result.setHours(0, 0, 0, 0);
    const currentDay = result.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7;
    result.setDate(result.getDate() + (daysUntil === 0 ? 7 : daysUntil));
    return result;
  }

  // Generate series ID
  const fridaySeriesId = crypto.randomUUID();
  const sundaySeriesId = crypto.randomUUID();

  // Create 8 weeks of recurring hangouts
  const weeksToCreate = 8;

  // Friday hangouts: 8am - 6pm with Zoro
  console.log('\n   📆 Friday hangouts (Edi & Tom + Zoro, 8am-6pm):');
  let nextFriday = getNextDayOfWeek(5); // 5 = Friday

  for (let i = 0; i < weeksToCreate; i++) {
    const startAt = new Date(nextFriday);
    startAt.setHours(8, 0, 0, 0);

    const endAt = new Date(nextFriday);
    endAt.setHours(18, 0, 0, 0);

    await prisma.hangout.create({
      data: {
        pupId: zoro.id,
        createdByOwnerUserId: annabellaLuke.id,
        assignedFriendUserId: ediTom.id,
        startAt,
        endAt,
        status: 'ASSIGNED',
        eventName: 'Friday hangout',
        seriesId: fridaySeriesId,
        seriesIndex: i + 1,
      },
    });

    console.log(`      ✓ ${startAt.toDateString()}`);

    // Move to next Friday
    nextFriday.setDate(nextFriday.getDate() + 7);
  }

  // Sunday-Monday hangouts: Sunday 7pm - Monday 6pm with Zoro
  console.log('\n   📆 Sunday-Monday hangouts (Edi & Tom + Zoro, Sun 7pm - Mon 6pm):');
  let nextSunday = getNextDayOfWeek(0); // 0 = Sunday

  for (let i = 0; i < weeksToCreate; i++) {
    const startAt = new Date(nextSunday);
    startAt.setHours(19, 0, 0, 0); // Sunday 7pm

    const endAt = new Date(nextSunday);
    endAt.setDate(endAt.getDate() + 1); // Monday
    endAt.setHours(18, 0, 0, 0); // Monday 6pm

    await prisma.hangout.create({
      data: {
        pupId: zoro.id,
        createdByOwnerUserId: annabellaLuke.id,
        assignedFriendUserId: ediTom.id,
        startAt,
        endAt,
        status: 'ASSIGNED',
        eventName: 'Sunday-Monday hangout',
        seriesId: sundaySeriesId,
        seriesIndex: i + 1,
      },
    });

    console.log(`      ✓ ${startAt.toDateString()} 7pm → ${endAt.toDateString()} 6pm`);

    // Move to next Sunday
    nextSunday.setDate(nextSunday.getDate() + 7);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Database Summary:');
  console.log('═'.repeat(50));

  const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
  const friendCount = await prisma.user.count({ where: { role: 'FRIEND' } });
  const pupCount = await prisma.pup.count();
  const friendshipCount = await prisma.pupFriendship.count();
  const hangoutCount = await prisma.hangout.count();

  console.log(`\n   👥 Owners: ${ownerCount}`);
  console.log(`   🤝 Friends: ${friendCount}`);
  console.log(`   🐕 Pups: ${pupCount}`);
  console.log(`   🔗 Friendships: ${friendshipCount}`);
  console.log(`   📅 Hangouts: ${hangoutCount}`);

  console.log('\n   Owners & Pups:');
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    include: { ownedPups: true },
  });
  for (const owner of owners) {
    const pups = owner.ownedPups.map(p => p.name).join(', ') || 'None';
    console.log(`      • ${owner.name}: ${pups}`);
  }

  console.log('\n   Friends & Pups they care for:');
  const friends = await prisma.user.findMany({
    where: { role: 'FRIEND' },
    include: { pupFriendships: { include: { pup: true } } },
  });
  for (const friend of friends) {
    const pups = friend.pupFriendships.map(f => f.pup.name).join(', ') || 'None';
    console.log(`      • ${friend.name}: ${pups}`);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✨ Database seeded successfully!');
  console.log('═'.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
