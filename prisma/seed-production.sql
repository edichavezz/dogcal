-- ============================================
-- DogCal Production Seed Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Clear existing data (order matters due to foreign keys)
DELETE FROM "HangoutNote";
DELETE FROM "HangoutSuggestion";
DELETE FROM "Hangout";
DELETE FROM "PupFriendship";
DELETE FROM "Pup";
DELETE FROM "User";

-- ============================================
-- CREATE OWNERS
-- ============================================

INSERT INTO "User" (id, name, role, "createdAt")
VALUES
  (gen_random_uuid(), 'Annabella & Luke', 'OWNER', NOW()),
  (gen_random_uuid(), 'Eduardo & Marina', 'OWNER', NOW()),
  (gen_random_uuid(), 'Autumn', 'OWNER', NOW()),
  (gen_random_uuid(), 'Natalie & James', 'OWNER', NOW()),
  (gen_random_uuid(), 'Richard', 'OWNER', NOW());

-- ============================================
-- CREATE FRIENDS
-- ============================================

INSERT INTO "User" (id, name, role, "createdAt")
VALUES
  (gen_random_uuid(), 'Edi & Tom', 'FRIEND', NOW()),
  (gen_random_uuid(), 'Jacqui', 'FRIEND', NOW()),
  (gen_random_uuid(), 'Vanessa', 'FRIEND', NOW()),
  (gen_random_uuid(), 'Karma''s mum', 'FRIEND', NOW());

-- ============================================
-- CREATE PUPS
-- ============================================

INSERT INTO "Pup" (id, name, breed, "ownerUserId", "createdAt")
SELECT gen_random_uuid(), 'Zoro', 'Havanese', id, NOW()
FROM "User" WHERE name = 'Annabella & Luke';

INSERT INTO "Pup" (id, name, breed, "ownerUserId", "createdAt")
SELECT gen_random_uuid(), 'Lorenzo', 'Welsh Corgi', id, NOW()
FROM "User" WHERE name = 'Eduardo & Marina';

INSERT INTO "Pup" (id, name, breed, "ownerUserId", "createdAt")
SELECT gen_random_uuid(), 'Navy', 'Working Labrador', id, NOW()
FROM "User" WHERE name = 'Autumn';

INSERT INTO "Pup" (id, name, "ownerUserId", "createdAt")
SELECT gen_random_uuid(), 'Mojo', id, NOW()
FROM "User" WHERE name = 'Natalie & James';

INSERT INTO "Pup" (id, name, "ownerUserId", "createdAt")
SELECT gen_random_uuid(), 'Indie', id, NOW()
FROM "User" WHERE name = 'Richard';

-- ============================================
-- CREATE FRIENDSHIPS
-- ============================================

-- Edi & Tom friendships (Zoro, Navy, Lorenzo, Mojo, Indie)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Zoro' AND u.name = 'Edi & Tom';

INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Navy' AND u.name = 'Edi & Tom';

INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Lorenzo' AND u.name = 'Edi & Tom';

INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Mojo' AND u.name = 'Edi & Tom';

INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Indie' AND u.name = 'Edi & Tom';

-- Jacqui friendship (Zoro)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Zoro' AND u.name = 'Jacqui';

-- Vanessa friendship (Zoro)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Zoro' AND u.name = 'Vanessa';

-- Karma's mum friendship (Navy)
INSERT INTO "PupFriendship" (id, "pupId", "friendUserId", "createdAt")
SELECT gen_random_uuid(), p.id, u.id, NOW()
FROM "Pup" p, "User" u WHERE p.name = 'Navy' AND u.name = 'Karma''s mum';

-- ============================================
-- CREATE RECURRING HANGOUTS (8 weeks)
-- ============================================

DO $$
DECLARE
  friday_series_id UUID := gen_random_uuid();
  sunday_series_id UUID := gen_random_uuid();
  zoro_id UUID;
  annabella_luke_id UUID;
  edi_tom_id UUID;
  next_friday DATE;
  next_sunday DATE;
  i INT;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  -- Get IDs
  SELECT id INTO zoro_id FROM "Pup" WHERE name = 'Zoro';
  SELECT id INTO annabella_luke_id FROM "User" WHERE name = 'Annabella & Luke';
  SELECT id INTO edi_tom_id FROM "User" WHERE name = 'Edi & Tom';

  -- Calculate next Friday
  next_friday := CURRENT_DATE + ((5 - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7) % 7);
  IF next_friday = CURRENT_DATE THEN next_friday := next_friday + 7; END IF;

  -- Calculate next Sunday
  next_sunday := CURRENT_DATE + ((7 - EXTRACT(DOW FROM CURRENT_DATE)::INT) % 7);
  IF next_sunday = CURRENT_DATE THEN next_sunday := next_sunday + 7; END IF;

  -- Create 8 weeks of Friday hangouts (8am - 6pm)
  FOR i IN 0..7 LOOP
    start_time := (next_friday + (i * 7))::TIMESTAMP + INTERVAL '8 hours';
    end_time := (next_friday + (i * 7))::TIMESTAMP + INTERVAL '18 hours';

    INSERT INTO "Hangout" (
      id, "pupId", "createdByOwnerUserId", "assignedFriendUserId",
      "startAt", "endAt", status, "eventName", "seriesId", "seriesIndex",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), zoro_id, annabella_luke_id, edi_tom_id,
      start_time, end_time, 'ASSIGNED', 'Friday hangout', friday_series_id, i + 1,
      NOW(), NOW()
    );
  END LOOP;

  -- Create 8 weeks of Sunday-Monday hangouts (Sun 7pm - Mon 6pm)
  FOR i IN 0..7 LOOP
    start_time := (next_sunday + (i * 7))::TIMESTAMP + INTERVAL '19 hours';
    end_time := (next_sunday + (i * 7) + 1)::TIMESTAMP + INTERVAL '18 hours';

    INSERT INTO "Hangout" (
      id, "pupId", "createdByOwnerUserId", "assignedFriendUserId",
      "startAt", "endAt", status, "eventName", "seriesId", "seriesIndex",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), zoro_id, annabella_luke_id, edi_tom_id,
      start_time, end_time, 'ASSIGNED', 'Sunday-Monday hangout', sunday_series_id, i + 1,
      NOW(), NOW()
    );
  END LOOP;
END $$;

-- ============================================
-- VERIFY RESULTS
-- ============================================

SELECT 'Owners' as type, COUNT(*) as count FROM "User" WHERE role = 'OWNER'
UNION ALL SELECT 'Friends', COUNT(*) FROM "User" WHERE role = 'FRIEND'
UNION ALL SELECT 'Pups', COUNT(*) FROM "Pup"
UNION ALL SELECT 'Friendships', COUNT(*) FROM "PupFriendship"
UNION ALL SELECT 'Hangouts', COUNT(*) FROM "Hangout";
