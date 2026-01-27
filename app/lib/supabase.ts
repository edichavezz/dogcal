// Supabase Client for Storage API
// Used for photo uploads to Supabase Storage

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PHOTO_BUCKET = 'dogcal-photos';

/**
 * Upload a photo to Supabase Storage
 * @param file - The file to upload
 * @param path - The path within the bucket (e.g., 'users/user-id.jpg' or 'pups/pup-id.jpg')
 * @returns The public URL of the uploaded file
 */
export async function uploadPhoto(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Replace existing file
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a photo from Supabase Storage
 * @param path - The path of the file to delete (e.g., 'users/user-id.jpg')
 */
export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}

/**
 * Get the storage path from a public URL
 * @param publicUrl - The public URL of the photo
 * @returns The storage path
 */
export function getPathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
