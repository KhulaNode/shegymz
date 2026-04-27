import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendPaymentReminderEmail,
  sendActivationReminderEmail,
} from '@/lib/email';
import { generateActivationToken, activationExpiresAt } from '@/lib/activation';

/**
 * POST /api/reminders/process
 *
 * Callable worker that processes overdue reminder records.
 * Call this from a cron job, GitHub Actions schedule, or admin UI.
 *
 * Protected by REMINDER_API_SECRET header (x-reminder-secret).
 *
 * Two reminder types:
 *  - PENDING_PAYMENT  → resend the payment link
 *  - PAID_ACCOUNT_PENDING → generate a fresh activation token and resend
 *
 * Opt-out: intents with status OPTED_OUT_UNPAID_REMINDERS are skipped.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-reminder-secret');
  if (!secret || secret !== process.env.REMINDER_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now              = new Date();
  const maxPayment       = parseInt(process.env.MAX_PAYMENT_REMINDERS    ?? '3', 10);
  const maxActivation    = parseInt(process.env.MAX_ACTIVATION_REMINDERS ?? '3', 10);
  const intervalHours    = parseInt(process.env.REMINDER_INTERVAL_HOURS  ?? '48', 10);
  const intervalMs       = intervalHours * 60 * 60 * 1000;
  const baseUrl          = (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  let paymentSent    = 0;
  let activationSent = 0;

  // ── Payment reminders ─────────────────────────────────────────────────────
  const pendingPayment = await prisma.subscriptionIntent.findMany({
    where: {
      status:               'PENDING_PAYMENT',
      nextReminderAt:       { lte: now },
      paymentReminderCount: { lt: maxPayment },
    },
  });

  for (const intent of pendingPayment) {
    if (!intent.paymentUrl) continue;
    const ok = await sendPaymentReminderEmail({
      name:           intent.fullName,
      email:          intent.email,
      paymentLink:    intent.paymentUrl,
      unsubscribeUrl: `${baseUrl}/api/reminders/opt-out?id=${intent.id}`,
    });
    if (ok) {
      paymentSent++;
      await prisma.subscriptionIntent.update({
        where: { id: intent.id },
        data: {
          paymentReminderSentAt: now,
          paymentReminderCount:  intent.paymentReminderCount + 1,
          nextReminderAt:        new Date(now.getTime() + intervalMs),
        },
      });
    }
  }

  // ── Activation reminders (generate fresh token each time) ─────────────────
  const pendingActivation = await prisma.subscriptionIntent.findMany({
    where: {
      status:                  'PAID_ACCOUNT_PENDING',
      nextReminderAt:          { lte: now },
      activationReminderCount: { lt: maxActivation },
    },
  });

  for (const intent of pendingActivation) {
    const { raw, hash } = generateActivationToken();
    const expiresAt     = activationExpiresAt();
    const activationUrl = `${baseUrl}/activate?token=${raw}`;

    const ok = await sendActivationReminderEmail({
      name:          intent.fullName,
      email:         intent.email,
      activationUrl,
    });

    if (ok) {
      activationSent++;
      // Replace the old token with the fresh one
      await prisma.subscriptionIntent.update({
        where: { id: intent.id },
        data: {
          activationTokenHash:      hash,
          activationTokenExpiresAt: expiresAt,
          activationReminderSentAt: now,
          activationReminderCount:  intent.activationReminderCount + 1,
          nextReminderAt:           new Date(now.getTime() + intervalMs),
        },
      });
    }
  }

  return NextResponse.json({
    processed: { paymentSent, activationSent },
    ranAt:     now.toISOString(),
  });
}
