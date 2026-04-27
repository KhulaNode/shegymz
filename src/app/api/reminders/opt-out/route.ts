import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reminders/opt-out?id=xxx
 *
 * Lets unpaid users opt out of payment reminder emails.
 * Only transitions PENDING_PAYMENT intents to OPTED_OUT_UNPAID_REMINDERS.
 * Paid (PAID_ACCOUNT_PENDING) intents are unaffected — those reminders continue
 * until account activation or expiry.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return new NextResponse(
      '<p>Invalid opt-out link.</p>',
      { status: 400, headers: { 'Content-Type': 'text/html' } },
    );
  }

  const intent = await prisma.subscriptionIntent.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!intent) {
    return new NextResponse(
      '<p>Opt-out link not found.</p>',
      { status: 404, headers: { 'Content-Type': 'text/html' } },
    );
  }

  // Only opt out unpaid intents; silently succeed for others
  if (intent.status === 'PENDING_PAYMENT') {
    await prisma.subscriptionIntent.update({
      where: { id },
      data:  { status: 'OPTED_OUT_UNPAID_REMINDERS', optedOutAt: new Date() },
    });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:sans-serif;max-width:500px;margin:60px auto;text-align:center;">
      <h2>You&apos;ve been unsubscribed</h2>
      <p>You will no longer receive payment reminder emails from SheGymZ.</p>
      <p>Changed your mind? <a href="${process.env.NEXT_PUBLIC_APP_URL ?? '/'}/subscribe">Start a new subscription</a>.</p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } },
  );
}
