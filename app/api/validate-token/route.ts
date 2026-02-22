/**
 * Validate Login Credential API Route
 *
 * Validates a username/credential and returns its type (admin, user, or invalid).
 * Used by the login form to determine where to redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateLoginToken } from '@/lib/loginTokens';
import { setActingUserId } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const usernameOrToken = body?.username ?? body?.token;

    if (!usernameOrToken || typeof usernameOrToken !== 'string') {
      return NextResponse.json({ valid: false, type: 'invalid' });
    }

    const trimmedCredential = usernameOrToken.trim();

    // Check if it's the admin credential
    const adminToken = process.env.ADMIN_TOKEN;
    if (adminToken && trimmedCredential === adminToken) {
      return NextResponse.json({ valid: true, type: 'admin' });
    }

    // Check if it's a valid user login credential
    const result = await validateLoginToken(trimmedCredential);
    if (result) {
      // Set the acting user cookie
      await setActingUserId(result.userId);
      return NextResponse.json({ valid: true, type: 'user', userId: result.userId });
    }

    // Invalid credential
    return NextResponse.json({ valid: false, type: 'invalid' });
  } catch (error) {
    console.error('Error validating login credential:', error);
    return NextResponse.json({ valid: false, type: 'invalid' });
  }
}
