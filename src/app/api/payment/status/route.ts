import { NextRequest, NextResponse } from 'next/server';
import { paymentStore, getPaymentProvider } from '@/lib/payments';

/**
 * GET /api/payment/status?ref=pay_xxx
 *
 * Returns the status of an internal payment record.
 * Used by the success/cancelled pages as a fallback verification
 * in case the webhook has not yet fired.
 *
 * If the record is still 'pending', this endpoint calls the provider
 * to verify the payment status directly (pull-based fallback).
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 });
  }

  const record = paymentStore.findById(ref);
  if (!record) {
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
  }

  // If still pending, do a live provider verification (fallback)
  if (record.status === 'pending' && record.providerReference) {
    try {
      const provider = getPaymentProvider();
      const verification = await provider.verifyPayment(record.providerReference);

      if (verification.success && verification.status && verification.status !== 'pending') {
        paymentStore.update(record.id, {
          status: verification.status,
          paidAt: verification.paidAt,
        });
        record.status = verification.status;
        record.paidAt = verification.paidAt;
      }
    } catch {
      // Best-effort — return the stored status if verification fails
    }
  }

  return NextResponse.json({
    id: record.id,
    status: record.status,
    planId: record.planId,
    provider: record.provider,
    paidAt: record.paidAt ?? null,
    // Return only safe fields — never return full metadata with PII
    currency: record.currency,
    amount: record.amount,
  });
}
