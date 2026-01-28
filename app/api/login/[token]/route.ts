/**
 * Login API Route
 *
 * Accepts login token, validates it, sets authentication cookie,
 * and redirects to home page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateLoginToken } from '@/lib/loginTokens';
import { setActingUserId } from '@/lib/cookies';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  // Validate token
  const result = await validateLoginToken(token);

  if (!result) {
    // Invalid token - redirect to error page
    return NextResponse.redirect(new URL('/login/invalid', request.url));
  }

  // Set acting user cookie
  await setActingUserId(result.userId);

  // Redirect to home page
  return NextResponse.redirect(new URL('/', request.url));
}
