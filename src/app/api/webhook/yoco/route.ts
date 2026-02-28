import { NextRequest, NextResponse } from 'next/server';
import { YocoProvider } from '@/lib/payments/yoco-provider';
import { paymentStore } from '@/lib/payments/payment-store';
import {
  sendPaymentConfirmationEmail,
  sendPaymentReceivedNotification,
  sendPaymentFailedEmail,
} from '@/lib/email';

/**
 * POST /api/webhook/yoco
 *
 * Yoco webhook handler for payment events.
 *
 * Security:
 *  - Signature verified via HMAC-SHA256 (X-Yoco-Signature header).
 *  - Set YOCO_WEBHOOK_SECRET in your env to enable verification.
 *    Webhooks are rejected when the secret is missing.
 *
 * Idempotency:
 *  - paymentStore.alreadyActivated() guards against duplicate activations.
 *  - Always responds 200 OK to prevent Yoco from retrying processed events.
 *
 * Setup in Yoco Dashboard:
 *  1. Go to Developers → Webhooks.
 *  2. Add webhook URL: https://yourdomain.com/api/webhook/yoco
 *  3. Copy the webhook secret and set it as YOCO_WEBHOOK_SECRET.
 *  4. Subscribe to: payment.succeeded, payment.failed, payment.cancelled.
 *
 * For local testing use ngrok — see Docs/YOCO_SMOKE_TEST.md.
 */

interface YocoWebhookPayload {
  id: string;
  type: 'payment.succeeded' | 'payment.failed' | 'payment.cancelled' | string;
  createdDate: string;
  payload: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    completedAt?: string;
    metadata?: {
      paymentRecordId?: string;
      userId?: string;
      planId?: string;
      name?: string;
      phone?: string;
      [key: string]: unknown;
    };
  };
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // ── Signature verification ────────────────────────────────────────────────
  const signature = request.headers.get('x-yoco-signature') ?? '';

  if (!YocoProvider.verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Yoco webhook] Invalid or missing signature — rejecting');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: YocoWebhookPayload;
  try {
    event = JSON.parse(rawBody) as YocoWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Log event type only — never log raw payload (may contain card details)
  console.log('[Yoco webhook] Received event:', {
    eventId: event.id,
    type: event.type,
    payloadId: event.payload?.id,
    createdDate: event.createdDate,
  });

  switch (event.type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(event);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event);
      break;

    case 'payment.cancelled':
      await handlePaymentCancelled(event);
      break;

    default:
      console.log('[Yoco webhook] Unhandled event type:', event.type);
  }

  // Always 200 — prevents Yoco from retrying events we have already handled
  return NextResponse.json({ received: true });
}

// ── Event handlers ──────────────────────────────────────────────────────────

async function handlePaymentSucceeded(event: YocoWebhookPayload) {
  try {
    const { payload } = event;
    const providerReference = payload.id;
    const metadata = payload.metadata ?? {};

    // ── Idempotency check ───────────────────────────────────────────────────
    if (paymentStore.alreadyActivated(providerReference)) {
      console.log('[Yoco webhook] Payment already activated — skipping:', providerReference);
      return;
    }

    // ── Find payment record ─────────────────────────────────────────────────
    // Primary lookup: by paymentRecordId embedded in metadata
    let record = metadata.paymentRecordId
      ? paymentStore.findById(metadata.paymentRecordId as string)
      : undefined;

    // Fallback: by providerReference (covers edge case where metadata is absent)
    if (!record) {
      record = paymentStore.findByProviderReference(providerReference);
    }

    if (!record) {
      console.error('[Yoco webhook] No payment record found for:', providerReference);
      // Still return normally — we don't want Yoco to retry
      return;
    }

    // ── Update payment record ───────────────────────────────────────────────
    const paidAt = payload.completedAt ?? new Date().toISOString();
    paymentStore.update(record.id, {
      status: 'paid',
      paidAt,
      providerReference, // ensure it's set (handles the creation-race edge case)
    });

    console.log('[Yoco webhook] Membership activated for userId:', record.userId);

    // ── Send confirmation emails (non-blocking) ─────────────────────────────
    const amountZAR = `R${(payload.amount / 100).toFixed(2)}`;
    const paymentDate = new Date(paidAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    Promise.all([
      sendPaymentConfirmationEmail({
        name: record.metadata.name,
        email: record.metadata.email,
        amount: amountZAR,
        paymentDate,
        reference: providerReference,
      }),
      sendPaymentReceivedNotification({
        name: record.metadata.name,
        email: record.metadata.email,
        amount: amountZAR,
        paymentDate,
        reference: providerReference,
      }),
    ]).catch((err) => {
      console.error('[Yoco webhook] Email error:', (err as Error).message);
    });
  } catch (err) {
    console.error('[Yoco webhook] Error in handlePaymentSucceeded:', (err as Error).message);
  }
}

async function handlePaymentFailed(event: YocoWebhookPayload) {
  try {
    const { payload } = event;
    const providerReference = payload.id;
    const metadata = payload.metadata ?? {};

    let record = metadata.paymentRecordId
      ? paymentStore.findById(metadata.paymentRecordId as string)
      : paymentStore.findByProviderReference(providerReference);

    if (record && record.status !== 'paid') {
      paymentStore.update(record.id, { status: 'failed' });
    }

    if (record) {
      const amountZAR = `R${(payload.amount / 100).toFixed(2)}`;
      sendPaymentFailedEmail({
        name: record.metadata.name,
        email: record.metadata.email,
        amount: amountZAR,
        reference: providerReference,
        reason: 'Payment could not be processed',
      }).catch((err) => {
        console.error('[Yoco webhook] Failed email error:', (err as Error).message);
      });
    }

    console.log('[Yoco webhook] Payment failed for providerReference:', providerReference);
  } catch (err) {
    console.error('[Yoco webhook] Error in handlePaymentFailed:', (err as Error).message);
  }
}

async function handlePaymentCancelled(event: YocoWebhookPayload) {
  try {
    const { payload } = event;
    const providerReference = payload.id;
    const metadata = payload.metadata ?? {};

    let record = metadata.paymentRecordId
      ? paymentStore.findById(metadata.paymentRecordId as string)
      : paymentStore.findByProviderReference(providerReference);

    if (record && record.status === 'pending') {
      paymentStore.update(record.id, { status: 'cancelled' });
    }

    console.log('[Yoco webhook] Payment cancelled for providerReference:', providerReference);
  } catch (err) {
    console.error('[Yoco webhook] Error in handlePaymentCancelled:', (err as Error).message);
  }
}
