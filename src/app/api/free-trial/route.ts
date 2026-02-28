import { NextRequest, NextResponse } from 'next/server';
import { sendFreeTrialRequestEmail } from '@/lib/email';

interface FreeTrialRequestBody {
  name: string;
  email: string;
  phone: string;
  bodyGoals?: string;
  referralName?: string;
}

export async function POST(request: NextRequest) {
  let body: FreeTrialRequestBody;

  try {
    body = (await request.json()) as FreeTrialRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, phone, bodyGoals, referralName } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email?.trim() || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  const sent = await sendFreeTrialRequestEmail({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    bodyGoals: bodyGoals?.trim(),
    referralName: referralName?.trim(),
  });

  if (!sent) {
    console.error('[free-trial] Email delivery failed for:', email);
    return NextResponse.json(
      { error: 'We could not process your request right now. Please try again later.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
