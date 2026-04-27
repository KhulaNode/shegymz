import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/activation';

/**
 * GET /api/auth/activate?token=xxx
 *
 * Validates an activation token without consuming it.
 * Called by the activation page on load to decide what to render.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const intent = await prisma.subscriptionIntent.findUnique({
    where: { activationTokenHash: tokenHash },
    select: {
      status:                   true,
      email:                    true,
      fullName:                 true,
      activationTokenExpiresAt: true,
      activationUsedAt:         true,
    },
  });

  if (!intent) {
    return NextResponse.json({ valid: false, reason: 'not_found' });
  }
  if (intent.activationUsedAt) {
    return NextResponse.json({ valid: false, reason: 'already_used' });
  }
  if (intent.status !== 'PAID_ACCOUNT_PENDING') {
    return NextResponse.json({ valid: false, reason: 'invalid_status' });
  }
  if (intent.activationTokenExpiresAt && intent.activationTokenExpiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: 'expired' });
  }

  return NextResponse.json({ valid: true, email: intent.email, name: intent.fullName });
}

/**
 * POST /api/auth/activate
 *
 * Finalises account creation for the credentials authentication method.
 * Google activation is handled transparently in auth.ts signIn callback.
 *
 * Body: { token, password, fullName? }
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string; fullName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { token, password, fullName: bodyFullName } = body;

  if (!token || !password) {
    return NextResponse.json({ error: 'token and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  // ── Find and validate intent ──────────────────────────────────────────────
  const intent = await prisma.subscriptionIntent.findUnique({
    where: { activationTokenHash: tokenHash },
  });

  if (!intent) {
    return NextResponse.json({ error: 'Invalid or expired activation link' }, { status: 400 });
  }
  if (intent.activationUsedAt) {
    return NextResponse.json({ error: 'This activation link has already been used' }, { status: 400 });
  }
  if (intent.status !== 'PAID_ACCOUNT_PENDING') {
    return NextResponse.json({ error: 'Invalid or expired activation link' }, { status: 400 });
  }
  if (intent.activationTokenExpiresAt && intent.activationTokenExpiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This activation link has expired. Please contact support.' },
      { status: 400 },
    );
  }

  const email    = intent.email;
  const fullName = bodyFullName?.trim() || intent.fullName || null;

  // ── Idempotency: if user already created, just mark intent used ───────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.subscriptionIntent.update({
      where: { id: intent.id },
      data:  { activationUsedAt: new Date(), status: 'ACCOUNT_CREATED', userId: existing.id },
    });
    return NextResponse.json({ success: true, email }, { status: 200 });
  }

  // ── Atomic: create User + Account + CLIENT role + Subscription ────────────
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, fullName, passwordHash, isActive: true },
    });

    await tx.account.create({
      data: { userId: user.id, provider: 'credentials', providerAccountId: user.id },
    });

    const clientRole = await tx.role.findUnique({ where: { code: 'CLIENT' } });
    if (clientRole) {
      await tx.userRole.create({
        data: { userId: user.id, roleId: clientRole.id },
      });
    }

    // Check if a Subscription was already created (e.g. Google path raced ahead)
    const existingSub = await tx.subscription.findUnique({ where: { intentId: intent.id } });
    if (!existingSub) {
      await tx.subscription.create({
        data: {
          userId:            user.id,
          status:            'ACTIVE',
          provider:          'paystack',
          providerReference: intent.providerReference ?? null,
          startedAt:         new Date(),
          intentId:          intent.id,
        },
      });
    }

    await tx.subscriptionIntent.update({
      where: { id: intent.id },
      data:  { status: 'ACCOUNT_CREATED', userId: user.id, activationUsedAt: new Date() },
    });
  });

  return NextResponse.json({ success: true, email }, { status: 201 });
}
