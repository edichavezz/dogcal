import { NextRequest, NextResponse } from 'next/server';
import { getActingUserId } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  timeRange: z.enum(['all', 'today', 'week', 'nextweek']).optional().default('all'),
  status: z.enum(['all', 'open', 'confirmed']).optional().default('all'),
  hideRepeats: z.enum(['true', 'false']).optional().default('false'),
  limit: z.coerce.number().min(1).max(50).optional().default(5),
  offset: z.coerce.number().min(0).optional().default(0),
  context: z.enum(['owner', 'friend-available', 'friend-assigned']).optional().default('owner'),
});

export async function GET(request: NextRequest) {
  try {
    const actingUserId = await getActingUserId();
    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: actingUserId },
      select: {
        role: true,
        ownedPups: { select: { id: true } },
        pupFriendships: { select: { pupId: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    const isOwner = user.role === 'OWNER';
    const pupIds = isOwner
      ? user.ownedPups.map(p => p.id)
      : user.pupFriendships.map(f => f.pupId);

    const now = new Date();

    // Build time filter
    let timeFilter: { gte?: Date; lte?: Date } = { gte: now };
    if (params.timeRange !== 'all') {
      const today = new Date();
      switch (params.timeRange) {
        case 'today':
          timeFilter = { gte: startOfDay(today), lte: endOfDay(today) };
          break;
        case 'week':
          timeFilter = { gte: startOfWeek(today, { weekStartsOn: 1 }), lte: endOfWeek(today, { weekStartsOn: 1 }) };
          break;
        case 'nextweek': {
          const nextWeek = addWeeks(today, 1);
          timeFilter = {
            gte: startOfWeek(nextWeek, { weekStartsOn: 1 }),
            lte: endOfWeek(nextWeek, { weekStartsOn: 1 }),
          };
          break;
        }
      }
    }

    // Build status filter
    let statusFilter: { in: string[] } | string | undefined;
    if (params.context === 'friend-available') {
      statusFilter = 'OPEN';
    } else if (params.context === 'friend-assigned') {
      statusFilter = 'ASSIGNED';
    } else if (params.status === 'open') {
      statusFilter = 'OPEN';
    } else if (params.status === 'confirmed') {
      statusFilter = 'ASSIGNED';
    } else {
      statusFilter = { in: ['OPEN', 'ASSIGNED'] };
    }

    // Build where clause based on context
    const whereClause: Prisma.HangoutWhereInput = {
      startAt: timeFilter,
      endAt: { gte: now },
      status: statusFilter,
    };

    if (params.context === 'friend-assigned') {
      whereClause.assignedFriendUserId = actingUserId;
    } else {
      whereClause.pupId = { in: pupIds };
    }

    const hangoutSummarySelect = {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      eventName: true,
      seriesId: true,
      seriesIndex: true,
      pup: {
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
        },
      },
      assignedFriend: {
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
        },
      },
    } satisfies Prisma.HangoutSelect;

    // Fast path when repeats are visible: paginate directly in DB.
    if (params.hideRepeats === 'false') {
      const [total, paginatedHangouts] = await Promise.all([
        prisma.hangout.count({ where: whereClause }),
        prisma.hangout.findMany({
          where: whereClause,
          orderBy: { startAt: 'asc' },
          skip: params.offset,
          take: params.limit,
          select: hangoutSummarySelect,
        }),
      ]);

      return NextResponse.json({
        hangouts: paginatedHangouts.map(h => ({
          ...h,
          startAt: h.startAt.toISOString(),
          endAt: h.endAt.toISOString(),
        })),
        total,
        hasMore: params.offset + params.limit < total,
      });
    }

    // Keep exact hide-repeats behavior by filtering after query.
    const hangouts = await prisma.hangout.findMany({
      where: whereClause,
      orderBy: { startAt: 'asc' },
      select: hangoutSummarySelect,
    });

    // Apply hideRepeats filter (client-side logic done server-side)
    let filteredHangouts = hangouts;
    if (params.hideRepeats === 'true') {
      const seenSeries = new Set<string>();
      filteredHangouts = hangouts.filter(h => {
        if (!h.seriesId) return true; // Non-recurring events always shown
        if (seenSeries.has(h.seriesId)) return false;
        seenSeries.add(h.seriesId);
        return true;
      });
    }

    // Apply pagination
    const total = filteredHangouts.length;
    const paginatedHangouts = filteredHangouts.slice(params.offset, params.offset + params.limit);

    return NextResponse.json({
      hangouts: paginatedHangouts.map(h => ({
        ...h,
        startAt: h.startAt.toISOString(),
        endAt: h.endAt.toISOString(),
      })),
      total,
      hasMore: params.offset + params.limit < total,
    });
  } catch (error) {
    console.error('Error fetching hangouts:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
