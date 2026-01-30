// API Route: Create Pup & Get All Pups
// POST /api/pups - Create a new pup
// GET /api/pups - Get all pups
// Body: { name, breed?, careInstructions?, profilePhotoUrl?, ownerUserId? }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

const createPupSchema = z.object({
  name: z.string().min(1).max(100),
  breed: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  careInstructions: z.string().max(2000).optional().nullable().transform(val => val === '' ? null : val),
  profilePhotoUrl: z.string().url().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  ownerUserId: z.string().uuid().optional(), // Allow admin to specify owner
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get('take') || '50'), 100); // Default 50, max 100
    const skip = parseInt(searchParams.get('skip') || '0');

    const [pups, total] = await Promise.all([
      prisma.pup.findMany({
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
          breed: true,
          ownerUserId: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take,
        skip,
      }),
      prisma.pup.count(),
    ]);

    return NextResponse.json({ pups, total, take, skip });
  } catch (error) {
    console.error('Get pups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createPupSchema.parse(body);

    // If ownerUserId is provided (admin creating pup), use that
    // Otherwise, use actingUserId (owner creating their own pup)
    let ownerUserId: string;

    if (data.ownerUserId) {
      // Admin mode - verify owner exists
      const owner = await prisma.user.findUnique({
        where: { id: data.ownerUserId },
      });

      if (!owner || owner.role !== 'OWNER') {
        return NextResponse.json(
          { error: 'Invalid owner user ID' },
          { status: 400 }
        );
      }

      ownerUserId = data.ownerUserId;
    } else {
      // Regular mode - require authentication
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

      ownerUserId = actingUserId;
    }

    const pup = await prisma.pup.create({
      data: {
        name: data.name,
        breed: data.breed,
        careInstructions: data.careInstructions,
        profilePhotoUrl: data.profilePhotoUrl,
        ownerUserId,
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
