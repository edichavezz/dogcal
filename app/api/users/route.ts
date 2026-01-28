// API Route: Get All Users / Create New User
// GET /api/users - Returns all users
// POST /api/users - Creates a new user (OWNER or FRIEND)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(['OWNER', 'FRIEND']),
  phoneNumber: z.string().max(20).optional().nullable().transform(val => val === '' ? null : val),
  profilePhotoUrl: z.string().url().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  address: z.string().max(500).optional().nullable().transform(val => val === '' ? null : val),
  addressText: z.string().max(500).optional().nullable().transform(val => val === '' ? null : val), // Legacy field
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        ownedPups: true,
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
    const body = await request.json();
    const data = createUserSchema.parse(body);

    // If not in admin mode (no role specified or trying to create from app),
    // require authentication
    if (!data.role) {
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
    }

    // Create user with all fields
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        role: data.role,
        phoneNumber: data.phoneNumber,
        profilePhotoUrl: data.profilePhotoUrl,
        address: data.address || data.addressText, // Support both field names
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
