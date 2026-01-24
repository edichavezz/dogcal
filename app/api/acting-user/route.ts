// API Route: Set Acting User
// POST /api/acting-user
// Body: { userId: string }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setActingUserId, clearActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const setActingUserSchema = z.object({
  userId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = setActingUserSchema.parse(body);

    if (!userId) {
      // Clear the acting user
      await clearActingUserId();
      return NextResponse.json({ success: true, actingUserId: null });
    }

    // Validate that user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Set the acting user cookie
    await setActingUserId(userId);

    return NextResponse.json({
      success: true,
      actingUserId: userId,
      userName: user.name,
      userRole: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error setting acting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
