// POST /api/photos - Upload a photo to Supabase Storage
// Used for user and pup profile photos

import { NextRequest, NextResponse } from 'next/server';
import { uploadPhoto, deletePhoto, getPathFromUrl } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';
import { z } from 'zod';

const uploadSchema = z.object({
  entityType: z.enum(['user', 'pup']),
  entityId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - please select a user' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate inputs
    const validated = uploadSchema.parse({ entityType, entityId });

    // Check permissions
    if (validated.entityType === 'user') {
      // Users can only update their own photo
      if (validated.entityId !== actingUserId) {
        return NextResponse.json(
          { error: 'You can only update your own profile photo' },
          { status: 403 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: validated.entityId },
        select: { profilePhotoUrl: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Delete old photo if exists
      if (user.profilePhotoUrl) {
        const oldPath = getPathFromUrl(user.profilePhotoUrl);
        if (oldPath) {
          try {
            await deletePhoto(oldPath);
          } catch (error) {
            console.error('Failed to delete old photo:', error);
            // Continue anyway
          }
        }
      }

      // Upload new photo
      const path = `users/${validated.entityId}.${file.name.split('.').pop()}`;
      const publicUrl = await uploadPhoto(file, path);

      // Update user
      await prisma.user.update({
        where: { id: validated.entityId },
        data: { profilePhotoUrl: publicUrl },
      });

      return NextResponse.json({ url: publicUrl });
    } else {
      // For pup photos, check if user is the owner
      const pup = await prisma.pup.findUnique({
        where: { id: validated.entityId },
        select: {
          ownerUserId: true,
          profilePhotoUrl: true
        },
      });

      if (!pup) {
        return NextResponse.json(
          { error: 'Pup not found' },
          { status: 404 }
        );
      }

      if (pup.ownerUserId !== actingUserId) {
        return NextResponse.json(
          { error: 'You can only update your own pup\'s photo' },
          { status: 403 }
        );
      }

      // Delete old photo if exists
      if (pup.profilePhotoUrl) {
        const oldPath = getPathFromUrl(pup.profilePhotoUrl);
        if (oldPath) {
          try {
            await deletePhoto(oldPath);
          } catch (error) {
            console.error('Failed to delete old photo:', error);
            // Continue anyway
          }
        }
      }

      // Upload new photo
      const path = `pups/${validated.entityId}.${file.name.split('.').pop()}`;
      const publicUrl = await uploadPhoto(file, path);

      // Update pup
      await prisma.pup.update({
        where: { id: validated.entityId },
        data: { profilePhotoUrl: publicUrl },
      });

      return NextResponse.json({ url: publicUrl });
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
