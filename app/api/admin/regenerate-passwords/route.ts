// API Route: Regenerate All User Passwords
// POST /api/admin/regenerate-passwords

import { NextResponse } from 'next/server';
import { regenerateAllPasswords } from '@/lib/loginTokens';

export async function POST() {
  try {
    const count = await regenerateAllPasswords();
    return NextResponse.json({
      success: true,
      message: `Regenerated ${count} passwords`,
      count
    });
  } catch (error) {
    console.error('Regenerate passwords error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate passwords' },
      { status: 500 }
    );
  }
}
