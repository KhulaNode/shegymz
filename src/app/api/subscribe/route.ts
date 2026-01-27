import { NextRequest, NextResponse } from 'next/server';
import { initializePaystackSubscription } from '@/lib/paystack';
import { 
  sendNewSubscriptionNotification, 
  sendSubscriptionInitiatedEmail 
} from '@/lib/email';

/**
 * POST /api/subscribe
 *
 * Initiates a Paystack subscription payment.
 * Takes member data and returns a redirect URL to Paystack.
 *
 * TODO (Production):
 * - Validate input server-side
 * - Store membership request in database
 * - Implement proper error handling
 * - Add rate limiting
 * - Add spam detection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, phone, bodyGoals, referralName } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Paystack transaction
    const paystackResult = await initializePaystackSubscription({
      name,
      email,
      phone,
      bodyGoals,
      referralName,
    });

    if (!paystackResult.success) {
      return NextResponse.json(
        { error: paystackResult.error || 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    // Send email notifications with payment link (non-blocking)
    const emailData = {
      name,
      email,
      phone,
      bodyGoals,
      referralName,
      paymentLink: paystackResult.authorizationUrl, // Include payment link in email
    };

    // Send emails asynchronously
    Promise.all([
      sendSubscriptionInitiatedEmail(emailData),
      sendNewSubscriptionNotification(emailData),
    ]).catch((error) => {
      console.error('Email notification error:', error);
      // Don't fail the request if email fails
    });

    return NextResponse.json({ 
      redirectUrl: paystackResult.authorizationUrl,
      reference: paystackResult.reference,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate subscription' },
      { status: 500 }
    );
  }
}
