-- DogCal Production Seed Script
-- Run this in Supabase SQL Editor or any PostgreSQL client
-- WARNING: This will DELETE ALL existing data!

BEGIN;

-- ============================================
-- CLEAR EXISTING DATA (order matters for foreign keys)
-- ============================================
DELETE FROM "HangoutNote";
DELETE FROM "HangoutSuggestion";
DELETE FROM "Hangout";
DELETE FROM "PupFriendship";
DELETE FROM "Pup";
DELETE FROM "User";

-- ============================================
-- CREATE OWNERS
-- ============================================
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt") VALUES
  ('owner-annabella-luke', 'Annabella & Luke', 'OWNER', NOW(), NOW()),
  ('owner-eduardo-marina', 'Eduardo & Marina', 'OWNER', NOW(), NOW()),
  ('owner-autumn', 'Autumn', 'OWNER', NOW(), NOW()),
  ('owner-natalie-james', 'Natalie & James', 'OWNER', NOW(), NOW()),
  ('owner-richard', 'Richard', 'OWNER', NOW(), NOW());

-- ============================================
-- CREATE PUPS
-- ============================================
INSERT INTO "Pup" (id, name, breed, "ownerUserId", "createdAt", "updatedAt") VALUES
  ('pup-zoro', 'Zoro', 'Havanese', 'owner-annabella-luke', NOW(), NOW()),
  ('pup-lorenzo', 'Lorenzo', 'Welsh Corgi', 'owner-eduardo-marina', NOW(), NOW()),
  ('pup-navy', 'Navy', 'Working Labrador', 'owner-autumn', NOW(), NOW()),
  ('pup-mojo', 'Mojo', NULL, 'owner-natalie-james', NOW(), NOW()),
  ('pup-indie', 'Indie', NULL, 'owner-richard', NOW(), NOW());

-- ============================================
-- CREATE FRIENDS
-- ============================================
INSERT INTO "User" (id, name, role, "createdAt", "updatedAt") VALUES
  ('friend-edi-tom', 'Edi & Tom', 'FRIEND', NOW(), NOW()),
  ('friend-jacqui', 'Jacqui', 'FRIEND', NOW(), NOW()),
  ('friend-vanessa', 'Vanessa', 'FRIEND', NOW(), NOW()),
  ('friend-karmas-mum', 'Karma''s mum', 'FRIEND', NOW(), NOW());

-- ============================================
-- CREATE FRIENDSHIPS
-- ============================================
-- Edi & Tom's friendships (all 5 pups)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt") VALUES
  (gen_random_uuid(), 'pup-zoro', 'friend-edi-tom', NOW()),
  (gen_random_uuid(), 'pup-navy', 'friend-edi-tom', NOW()),
  (gen_random_uuid(), 'pup-lorenzo', 'friend-edi-tom', NOW()),
  (gen_random_uuid(), 'pup-mojo', 'friend-edi-tom', NOW()),
  (gen_random_uuid(), 'pup-indie', 'friend-edi-tom', NOW());

-- Jacqui's friendships (Zoro)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt") VALUES
  (gen_random_uuid(), 'pup-zoro', 'friend-jacqui', NOW());

-- Vanessa's friendships (Zoro)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt") VALUES
  (gen_random_uuid(), 'pup-zoro', 'friend-vanessa', NOW());

-- Karma's mum's friendships (Navy)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt") VALUES
  (gen_random_uuid(), 'pup-navy', 'friend-karmas-mum', NOW());

-- ============================================
-- CREATE RECURRING HANGOUTS
-- ============================================
-- Series IDs for recurring events
-- Friday series: 8am - 6pm with Zoro (8 weeks)
-- Sunday-Monday series: Sunday 7pm - Monday 6pm with Zoro (8 weeks)

DO $$
DECLARE
  friday_series_id UUID := gen_random_uuid();
  sunday_series_id UUID := gen_random_uuid();
  next_friday DATE;
  next_sunday DATE;
  i INT;
  start_ts TIMESTAMP;
  end_ts TIMESTAMP;
BEGIN
  -- Find next Friday from today
  next_friday := CURRENT_DATE + ((5 - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7) % 7);
  IF next_friday = CURRENT_DATE THEN
    next_friday := next_friday + 7;
  END IF;

  -- Find next Sunday from today
  next_sunday := CURRENT_DATE + ((7 - EXTRACT(DOW FROM CURRENT_DATE)::INT) % 7);
  IF next_sunday = CURRENT_DATE THEN
    next_sunday := next_sunday + 7;
  END IF;

  -- Create 8 weeks of Friday hangouts (8am - 6pm)
  FOR i IN 1..8 LOOP
    start_ts := next_friday + ((i-1) * 7) + TIME '08:00:00';
    end_ts := next_friday + ((i-1) * 7) + TIME '18:00:00';

    INSERT INTO "Hangout" (id, "pupId", "createdByOwnerUserId", "assignedFriendUserId", "startAt", "endAt", status, "eventName", "seriesId", "seriesIndex", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'pup-zoro',
      'owner-annabella-luke',
      'friend-edi-tom',
      start_ts,
      end_ts,
      'ASSIGNED',
      'Friday hangout',
      friday_series_id,
      i,
      NOW(),
      NOW()
    );
  END LOOP;

  -- Create 8 weeks of Sunday-Monday hangouts (Sunday 7pm - Monday 6pm)
  FOR i IN 1..8 LOOP
    start_ts := next_sunday + ((i-1) * 7) + TIME '19:00:00';
    end_ts := next_sunday + ((i-1) * 7) + 1 + TIME '18:00:00'; -- +1 day for Monday

    INSERT INTO "Hangout" (id, "pupId", "createdByOwnerUserId", "assignedFriendUserId", "startAt", "endAt", status, "eventName", "seriesId", "seriesIndex", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'pup-zoro',
      'owner-annabella-luke',
      'friend-edi-tom',
      start_ts,
      end_ts,
      'ASSIGNED',
      'Sunday-Monday hangout',
      sunday_series_id,
      i,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Owners' as type, COUNT(*) as count FROM "User" WHERE role = 'OWNER'
UNION ALL
SELECT 'Friends', COUNT(*) FROM "User" WHERE role = 'FRIEND'
UNION ALL
SELECT 'Pups', COUNT(*) FROM "Pup"
UNION ALL
SELECT 'Friendships', COUNT(*) FROM "PupFriendship"
UNION ALL
SELECT 'Hangouts', COUNT(*) FROM "Hangout";

COMMIT;
