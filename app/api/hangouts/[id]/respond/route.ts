// API Route: Respond to Hangout Invite via WhatsApp Link
// GET /api/hangouts/:id/respond?response=yes|no&token=loginToken

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { setActingUserId } from '@/lib/cookies';
import { validateLoginToken } from '@/lib/loginTokens';

const responseSchema = z.object({
  response: z.enum(['yes', 'no']),
  token: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const responseParam = searchParams.get('response') ?? '';
  const tokenParam = searchParams.get('token') ?? '';

  const parseResult = responseSchema.safeParse({
    response: responseParam,
    token: tokenParam,
  });

  if (!parseResult.success) {
    return NextResponse.redirect(new URL('/login/invalid', request.url));
  }

  const loginResult = await validateLoginToken(parseResult.data.token);
  if (!loginResult) {
    return NextResponse.redirect(new URL('/login/invalid', request.url));
  }

  const respondingUser = await prisma.user.findUnique({
    where: { id: loginResult.userId },
  });

  if (!respondingUser || respondingUser.role !== 'FRIEND') {
    return NextResponse.redirect(new URL('/calendar?response=not-allowed', request.url));
  }

  const hangout = await prisma.hangout.findUnique({
    where: { id },
    include: {
      pup: true,
    },
  });

  if (!hangout) {
    return NextResponse.redirect(new URL('/calendar?response=not-found', request.url));
  }

  if (hangout.status !== 'OPEN') {
    return NextResponse.redirect(new URL('/calendar?response=closed', request.url));
  }

  const friendship = await prisma.pupFriendship.findFirst({
    where: {
      pupId: hangout.pupId,
      friendUserId: respondingUser.id,
    },
  });

  if (!friendship) {
    return NextResponse.redirect(new URL('/calendar?response=not-allowed', request.url));
  }

  const responseStatus = parseResult.data.response === 'yes' ? 'YES' : 'NO';

  await prisma.hangoutResponse.upsert({
    where: {
      hangoutId_responderUserId: {
        hangoutId: hangout.id,
        responderUserId: respondingUser.id,
      },
    },
    update: {
      status: responseStatus,
      respondedAt: new Date(),
    },
    create: {
      hangoutId: hangout.id,
      responderUserId: respondingUser.id,
      status: responseStatus,
    },
  });

  await setActingUserId(respondingUser.id);

  return NextResponse.redirect(new URL(`/calendar?response=${responseParam}`, request.url));
}
