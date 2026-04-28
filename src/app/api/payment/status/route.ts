import { NextRequest, NextResponse } from 'next/server';
import { PaystackProvider } from '@/lib/payments/paystack-provider';

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 });
  }

  try {
    const provider = new PaystackProvider();
    const verification = await provider.verifyPayment(ref);

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error ?? 'Unable to verify payment status' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      reference: ref,
      status: verification.status ?? 'pending',
      paidAt: verification.paidAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to verify payment status' }, { status: 500 });
  }
}
