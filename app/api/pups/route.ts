// API Route: Create Pup
// POST /api/pups
// Body: { name, careInstructions?, profilePhotoUrl? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createPupSchema = z.object({
  name: z.string().min(1).max(100),
  careInstructions: z.string().max(2000).optional().nullable(),
  profilePhotoUrl: z.string().url().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
    });

    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can create pups' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createPupSchema.parse(body);

    const pup = await prisma.pup.create({
      data: {
        ...data,
        ownerUserId: actingUserId,
      },
    });

    return NextResponse.json({ pup }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create pup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
