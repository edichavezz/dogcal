/**
 * Validate Token API Route
 *
 * Validates a token and returns its type (admin, user, or invalid).
 * Used by the login form to determine where to redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateLoginToken } from '@/lib/loginTokens';
import { setActingUserId } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false, type: 'invalid' });
    }

    const trimmedToken = token.trim();

    // Check if it's the admin token
    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken && trimmedToken === adminToken) {
      return NextResponse.json({ valid: true, type: 'admin' });
    }

    // Check if it's a valid user login token
    const result = await validateLoginToken(trimmedToken);
    if (result) {
      // Set the acting user cookie
      await setActingUserId(result.userId);
      return NextResponse.json({ valid: true, type: 'user', userId: result.userId });
    }

    // Invalid token
    return NextResponse.json({ valid: false, type: 'invalid' });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ valid: false, type: 'invalid' });
  }
}
