-- Supabase Storage Policies for dogcal-photos bucket
-- Run these in Supabase Dashboard → SQL Editor

-- 1. Enable public read access to photos
CREATE POLICY "Public photos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'dogcal-photos');

-- 2. Allow anyone to upload photos (we validate in API layer)
CREATE POLICY "Anyone can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dogcal-photos');

-- 3. Allow anyone to delete photos (we validate in API layer)
CREATE POLICY "Anyone can delete photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'dogcal-photos');

-- 4. Allow anyone to update photos (for future use)
CREATE POLICY "Anyone can update photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dogcal-photos');
