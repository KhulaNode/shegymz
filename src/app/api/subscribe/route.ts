import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getPaymentProvider,
  paymentStore,
  DEFAULT_PLAN_ID,
  getPlan,
} from '@/lib/payments';
import {
  sendNewSubscriptionNotification,
  sendSubscriptionInitiatedEmail,
} from '@/lib/email';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/subscribe
 *
 * Creates a Paystack checkout session for the selected plan and returns a redirect URL.
 *
 * Flow:
 *  1. Validate request body.
 *  2. Create a 'pending' payment record in the store.
 *  3. Call the active payment provider to create a hosted checkout.
 *  4. Update the payment record with the provider reference.
 *  5. Return { redirectUrl, ref } to the frontend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, bodyGoals, referralName, planId } = body as {
      name?: string;
      email?: string;
      phone?: string;
      bodyGoals?: string;
      referralName?: string;
      planId?: string;
    };

    // ── Input validation ──────────────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 },
      );
    }
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const resolvedPlanId = planId ?? DEFAULT_PLAN_ID;
    const plan = getPlan(resolvedPlanId);
    if (!plan) {
      return NextResponse.json({ error: `Unknown plan: ${resolvedPlanId}` }, { status: 400 });
    }

    // ── Create pending payment record ─────────────────────────────────────────
    const paymentRecordId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const userId = email.toLowerCase().trim();
    const providerName: 'paystack' = 'paystack';

    paymentStore.create({
      id: paymentRecordId,
      userId,
      planId: resolvedPlanId,
      provider: providerName,
      providerReference: '', // filled in after provider responds
      amount: plan.amountCents,
      currency: plan.currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        name: name.trim(),
        email: userId,
        phone: phone.trim(),
        bodyGoals: bodyGoals?.trim(),
        referralName: referralName?.trim(),
      },
    });

    // ── Create checkout with active provider ──────────────────────────────────
    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      planId: resolvedPlanId,
      userId,
      paymentRecordId,
      metadata: {
        name: name.trim(),
        email: userId,
        phone: phone.trim(),
        bodyGoals: bodyGoals?.trim(),
        referralName: referralName?.trim(),
      },
    });

    if (!checkout.success || !checkout.checkoutUrl) {
      paymentStore.update(paymentRecordId, { status: 'failed' });
      return NextResponse.json(
        { error: checkout.error ?? 'Failed to create checkout' },
        { status: 500 },
      );
    }

    // ── Persist the provider reference ────────────────────────────────────────
    paymentStore.update(paymentRecordId, {
      providerReference: checkout.providerReference ?? '',
    });
    // ── Create SubscriptionIntent in DB (non-fatal if it fails) ───────────────
    try {
      const intent = await prisma.subscriptionIntent.create({
        data: {
          email:             userId,
          fullName:          name.trim(),
          phone:             phone.trim(),
          planCode:          resolvedPlanId,
          status:            'PENDING_PAYMENT',
          providerCheckoutId: checkout.providerReference ?? null,
          paymentUrl:        checkout.checkoutUrl,
          providerReference: checkout.providerReference ?? null,
        },
      });

      // Embed intentId into paymentStore metadata so the webhook can do a direct lookup
      const currentRecord = paymentStore.findById(paymentRecordId);
      if (currentRecord) {
        paymentStore.update(paymentRecordId, {
          metadata: { ...currentRecord.metadata, intentId: intent.id },
        });
      }
    } catch (dbErr) {
      // Non-fatal — the hosted payment flow continues without the DB intent
      console.error('[subscribe] Failed to create SubscriptionIntent:', (dbErr as Error).message);
    }
    // ── Send email notifications (non-blocking) ───────────────────────────────
    const emailData = {
      name: name.trim(),
      email: userId,
      phone: phone.trim(),
      bodyGoals,
      referralName,
      paymentLink: checkout.checkoutUrl,
    };
    Promise.all([
      sendSubscriptionInitiatedEmail(emailData),
      sendNewSubscriptionNotification(emailData),
    ]).catch((err) => {
      // Never log PII — only the error message
      console.error('[subscribe] Email notification error:', (err as Error).message);
    });

    return NextResponse.json({
      redirectUrl: checkout.checkoutUrl,
      ref: paymentRecordId,
    });
  } catch (error) {
    console.error('[subscribe] Unexpected error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Failed to initiate subscription' },
      { status: 500 },
    );
  }
}
