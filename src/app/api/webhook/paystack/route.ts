import { NextRequest, NextResponse } from 'next/server';
import { PaystackProvider } from '@/lib/payments/paystack-provider';
import {
  sendPaymentFailedEmail,
  sendPaymentReceivedNotification,
  sendPaymentSuccessEmail,
} from '@/lib/email';

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
      name?: string;
      email?: string;
      phone?: string;
      [key: string]: unknown;
    };
    customer?: {
      email?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => '');
  if (!rawBody) {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  const signatureHeader = request.headers.get('x-paystack-signature') ?? '';
  if (!PaystackProvider.verifyWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaystackWebhookPayload;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  switch (event.event) {
    case 'charge.success':
      await handlePaymentSucceeded(event);
      break;
    case 'charge.failed':
      await handlePaymentFailed(event);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(event: PaystackWebhookPayload) {
  const metadata = event.data.metadata ?? {};
  const email = metadata.email ?? event.data.customer?.email;
  const name = metadata.name ?? 'SheGymZ Member';

  if (!email) {
    console.error('[Paystack webhook] Successful payment missing email', event.data.reference);
    return;
  }

  const amount = `${event.data.currency} ${(event.data.amount / 100).toFixed(2)}`;
  const paymentDate = event.data.paid_at
    ? new Date(event.data.paid_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  await Promise.allSettled([
    sendPaymentSuccessEmail({
      name,
      email,
      amount,
      paymentDate,
      reference: event.data.reference,
    }),
    sendPaymentReceivedNotification({
      name,
      email,
      amount,
      paymentDate,
      reference: event.data.reference,
    }),
  ]);
}

async function handlePaymentFailed(event: PaystackWebhookPayload) {
  const metadata = event.data.metadata ?? {};
  const email = metadata.email ?? event.data.customer?.email;
  const name = metadata.name ?? 'SheGymZ Member';

  if (!email) {
    return;
  }

  const amount = `${event.data.currency} ${(event.data.amount / 100).toFixed(2)}`;

  await sendPaymentFailedEmail({
    name,
    email,
    amount,
    reference: event.data.reference,
    reason: event.data.gateway_response || 'Payment could not be processed',
  });
}
