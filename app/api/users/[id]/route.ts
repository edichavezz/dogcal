// API Route: Update User Profile
// PATCH /api/users/:id
// Body: { name?, addressText?, profilePhotoUrl? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  addressText: z.string().max(500).optional().nullable(),
  phoneNumber: z.string().max(50).optional().nullable(),
  profilePhotoUrl: z.string().url().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own profile
    if (actingUserId !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = updateUserSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
