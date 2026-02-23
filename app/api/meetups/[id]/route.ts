import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserId } from '@/lib/cookies';

// DELETE /api/meetups/:id - delete a single meetup (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actingUserId = await getActingUserId();

    if (!actingUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetup = await prisma.communityMeetup.findUnique({ where: { id } });
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    await prisma.communityMeetup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meetup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
