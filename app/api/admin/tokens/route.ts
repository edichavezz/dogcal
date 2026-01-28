// API Route: Generate Login Tokens for All Users
// GET /api/admin/tokens

import { NextResponse } from 'next/server';
import { generateAllTokens } from '@/lib/loginTokens';

export async function GET() {
  try {
    const tokens = await generateAllTokens();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Generate tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tokens' },
      { status: 500 }
    );
  }
}
