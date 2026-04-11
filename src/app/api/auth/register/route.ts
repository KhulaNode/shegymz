import { NextResponse } from 'next/server';

/**
 * POST /api/auth/register — DISABLED
 *
 * Open self-registration has been replaced by the payment-gated activation flow.
 * New accounts are created only via POST /api/auth/activate after verified payment.
 *
 * New members: /subscribe → Yoco payment → activation email → /activate?token=xxx
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Open registration is not available. ' +
        'To create an account, complete a subscription at /subscribe ' +
        'and follow the activation link sent to your email after payment.',
    },
    { status: 403 },
  );
}
