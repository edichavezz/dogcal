// API Route: Get All Users / Create New Friend User
// GET /api/users - Returns all users for the "act as user" selector
// POST /api/users - Creates a new FRIEND user (owner only)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  addressText: z.string().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        profilePhotoUrl: true,
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then FRIEND
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
    });

    // Only owners can create friend users
    if (!actingUser || actingUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can create friends' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const newUser = await prisma.user.create({
      data: {
        ...data,
        role: 'FRIEND',
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
