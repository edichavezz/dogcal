// Cookie utilities for managing acting user
import { cookies } from 'next/headers';

const ACTING_USER_COOKIE = 'acting_user_id';

export async function getActingUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTING_USER_COOKIE)?.value || null;
}

export async function setActingUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTING_USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function clearActingUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTING_USER_COOKIE);
}
