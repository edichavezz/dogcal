// Admin API: Delete Friendship by ID
// DELETE /api/admin/friendships/:id

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.pupFriendship.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }
    console.error('Admin delete friendship error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
