import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PaystackProvider } from '@/lib/payments/paystack-provider';
import { DEFAULT_PLAN_ID, getPlan } from '@/lib/payments/plans';
import {
  sendNewSubscriptionNotification,
  sendSubscriptionInitiatedEmail,
} from '@/lib/email';

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

    const paymentReference = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

    const provider = new PaystackProvider();
    const checkout = await provider.createCheckout({
      planId: resolvedPlanId,
      userId: normalizedEmail,
      paymentRecordId: paymentReference,
      metadata: {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        bodyGoals: bodyGoals?.trim(),
        referralName: referralName?.trim(),
      },
    });

    if (!checkout.success || !checkout.checkoutUrl) {
      return NextResponse.json(
        { error: checkout.error ?? 'Failed to create checkout' },
        { status: 500 },
      );
    }

    const emailData = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      bodyGoals: bodyGoals?.trim(),
      referralName: referralName?.trim(),
      paymentLink: checkout.checkoutUrl,
    };

    Promise.all([
      sendSubscriptionInitiatedEmail(emailData),
      sendNewSubscriptionNotification(emailData),
    ]).catch((err) => {
      console.error('[subscribe] Email notification error:', (err as Error).message);
    });

    return NextResponse.json({
      redirectUrl: checkout.checkoutUrl,
      ref: checkout.providerReference ?? paymentReference,
      planAmount: plan.amountCents,
      planCurrency: plan.currency,
    });
  } catch (error) {
    console.error('[subscribe] Unexpected error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Failed to initiate subscription' },
      { status: 500 },
    );
  }
}
