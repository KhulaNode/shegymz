import { NextRequest, NextResponse } from 'next/server';
import { PaystackProvider } from '@/lib/payments/paystack-provider';
import { paymentStore } from '@/lib/payments/payment-store';
import {
  sendPaymentConfirmationEmail,
  sendPaymentReceivedNotification,
  sendPaymentFailedEmail,
  sendActivationEmail,
} from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { generateActivationToken, activationExpiresAt } from '@/lib/activation';

/**
 * POST /api/webhook/paystack
 *
 * Paystack webhook handler for payment events.
 *
 * Security:
 *  - Signature verified using x-paystack-signature and the secret key.
 *  - Always responds 200 after processing to avoid duplicate retries for handled events.
 *
 * Setup in Paystack Dashboard:
 *  1. Go to Settings -> API Keys & Webhooks.
 *  2. Add webhook URL: https://yourdomain.com/api/webhook/paystack
 *  3. Subscribe to: charge.success, charge.failed.
 */

interface PaystackWebhookPayload {
  event: 'charge.success' | 'charge.failed' | string;
  data: {
    amount: number;
    currency: string;
    status: string;
    reference: string;
    paid_at?: string;
    gateway_response?: string;
    metadata?: {
      paymentRecordId?: string;
      userId?: string;
      planId?: string;
      name?: string;
      email?: string;
      phone?: string;
      intentId?: string;
      [key: string]: unknown;
    };
    customer?: {
      email?: string;
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

  const signatureHeader = request.headers.get('x-paystack-signature') ?? '';
  if (!PaystackProvider.verifyWebhookSignature(rawBody, signatureHeader)) {
    console.warn('[Paystack webhook] Invalid or missing signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaystackWebhookPayload;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  console.log('[Paystack webhook] Received event:', {
    event: event.event,
    reference: event.data?.reference,
    status: event.data?.status,
  });

  switch (event.event) {
    case 'charge.success':
      await handlePaymentSucceeded(event);
      break;
    case 'charge.failed':
      await handlePaymentFailed(event);
      break;
    default:
      console.log('[Paystack webhook] Unhandled event type:', event.event);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(event: PaystackWebhookPayload) {
  try {
    const providerReference = event.data.reference;
    const metadata = event.data.metadata ?? {};

    if (paymentStore.alreadyActivated(providerReference)) {
      console.log('[Paystack webhook] Payment already activated — skipping:', providerReference);
      return;
    }

    let record = metadata.paymentRecordId
      ? paymentStore.findById(metadata.paymentRecordId as string)
      : undefined;

    if (!record) {
      record = paymentStore.findByProviderReference(providerReference);
    }

    if (!record) {
      console.error('[Paystack webhook] No payment record found for:', providerReference);
      return;
    }

    const paidAt = event.data.paid_at ?? new Date().toISOString();
    paymentStore.update(record.id, {
      status: 'paid',
      paidAt,
      providerReference,
    });

    const amountZAR = `R${(event.data.amount / 100).toFixed(2)}`;
    const paymentDate = new Date(paidAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    try {
      const intentId = metadata.intentId as string | undefined;
      const intent = intentId
        ? await prisma.subscriptionIntent.findUnique({ where: { id: intentId } })
        : await prisma.subscriptionIntent.findFirst({
            where: { email: record.metadata.email, status: 'PENDING_PAYMENT' },
            orderBy: { createdAt: 'desc' },
          });

      if (intent && intent.status === 'PENDING_PAYMENT') {
        const { raw, hash } = generateActivationToken();
        const expiresAt = activationExpiresAt();
        const baseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
        const activationUrl = `${baseUrl}/activate?token=${raw}`;

        await prisma.subscriptionIntent.update({
          where: { id: intent.id },
          data: {
            status: 'PAID_ACCOUNT_PENDING',
            providerPaymentId: providerReference,
            activationTokenHash: hash,
            activationTokenExpiresAt: expiresAt,
          },
        });

        sendActivationEmail({
          name: record.metadata.name,
          email: record.metadata.email,
          activationUrl,
          amount: amountZAR,
          paymentDate,
          reference: providerReference,
        }).catch((e) =>
          console.error('[Paystack webhook] Activation email error:', (e as Error).message),
        );

        sendPaymentReceivedNotification({
          name: record.metadata.name,
          email: record.metadata.email,
          amount: amountZAR,
          paymentDate,
          reference: providerReference,
        }).catch((e) =>
          console.error('[Paystack webhook] Admin email error:', (e as Error).message),
        );

        return;
      }
    } catch (dbErr) {
      console.error('[Paystack webhook] SubscriptionIntent update failed:', (dbErr as Error).message);
    }

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
      console.error('[Paystack webhook] Email error:', (err as Error).message);
    });
  } catch (err) {
    console.error('[Paystack webhook] Error in handlePaymentSucceeded:', (err as Error).message);
  }
}

async function handlePaymentFailed(event: PaystackWebhookPayload) {
  try {
    const providerReference = event.data.reference;
    const metadata = event.data.metadata ?? {};

    let record = metadata.paymentRecordId
      ? paymentStore.findById(metadata.paymentRecordId as string)
      : paymentStore.findByProviderReference(providerReference);

    if (record && record.status !== 'paid') {
      paymentStore.update(record.id, { status: 'failed' });
    }

    if (record) {
      const amountZAR = `R${(event.data.amount / 100).toFixed(2)}`;
      sendPaymentFailedEmail({
        name: record.metadata.name,
        email: record.metadata.email,
        amount: amountZAR,
        reference: providerReference,
        reason: event.data.gateway_response || 'Payment could not be processed',
      }).catch((err) => {
        console.error('[Paystack webhook] Failed email error:', (err as Error).message);
      });
    }

    console.log('[Paystack webhook] Payment failed for providerReference:', providerReference);
  } catch (err) {
    console.error('[Paystack webhook] Error in handlePaymentFailed:', (err as Error).message);
  }
}
