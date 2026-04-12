import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/lib/activation';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/activate/google
 *
 * Stages a Google activation by validating the token and setting a short-lived
 * HttpOnly cookie containing the activation hash. The NextAuth signIn callback
 * reads this cookie to authorise the Google sign-in regardless of which Google
 * account email the user chooses (it may differ from their subscription email).
 *
 * The cookie expires in 5 minutes — enough time to complete the OAuth round-trip.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const hash = hashToken(token);
  const intent = await prisma.subscriptionIntent.findUnique({
    where: { activationTokenHash: hash },
    select: {
      status:                   true,
      activationUsedAt:         true,
      activationTokenExpiresAt: true,
    },
  });

  if (
    !intent ||
    intent.status !== 'PAID_ACCOUNT_PENDING' ||
    intent.activationUsedAt !== null ||
    (intent.activationTokenExpiresAt && intent.activationTokenExpiresAt < new Date())
  ) {
    return NextResponse.json({ error: 'Invalid or expired activation token' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('activation_hash', hash, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   300, // 5 minutes — enough for the OAuth round-trip
    path:     '/',
  });
  return response;
}
