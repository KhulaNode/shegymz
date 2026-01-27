import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPaystackWebhook, 
  verifyPaystackTransaction,
  formatPaystackAmount,
  enableRecurringSubscription,
  PaystackWebhookEvent 
} from '@/lib/paystack';
import { 
  sendPaymentConfirmationEmail, 
  sendPaymentReceivedNotification,
  sendPaymentFailedEmail
} from '@/lib/email';

/**
 * POST /api/webhook/paystack
 *
 * Paystack webhook handler for payment notifications.
 *
 * IMPORTANT SECURITY NOTES:
 * 1. ALWAYS verify the webhook signature before processing
 * 2. Use HTTPS in production
 * 3. Store webhook payloads for audit trail
 * 4. Implement idempotency to handle duplicate webhooks
 * 5. Verify payment status independently by calling Paystack API
 *
 * Webhook Events:
 * - charge.success: Payment successful
 * - charge.failed: Payment failed
 * - subscription.create: New subscription created
 * - subscription.disable: Subscription cancelled
 *
 * Setup in Paystack Dashboard:
 * 1. Go to Settings → Webhooks
 * 2. Add webhook URL: https://yourdomain.com/api/webhook/paystack
 * 3. Select events to listen to
 * 4. Save webhook
 *
 * TODO (Production - HIGH PRIORITY):
 * - Store webhook events in database for audit trail
 * - Implement idempotency check (prevent duplicate processing)
 * - Update member status in database
 * - Handle failed payments
 * - Handle subscription cancellations
 * - Add comprehensive error logging
 * - Implement retry mechanism for failed database operations
 * - Add monitoring and alerting
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.warn('Paystack webhook received without signature');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify webhook signature
    const isValidSignature = verifyPaystackWebhook(body, signature);

    if (!isValidSignature) {
      console.warn('Invalid Paystack webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const event: PaystackWebhookEvent = JSON.parse(body);

    console.log('Paystack webhook received:', {
      event: event.event,
      reference: event.data.reference,
      status: event.data.status,
      amount: event.data.amount,
      email: event.data.customer.email,
      timestamp: new Date().toISOString(),
    });

    // Handle different webhook events
    switch (event.event) {
      case 'charge.success':
        await handlePaymentSuccess(event);
        break;

      case 'charge.failed':
        await handlePaymentFailed(event);
        break;

      case 'subscription.create':
        console.log('Subscription created:', event.data.reference);
        // TODO: Handle subscription creation
        break;

      case 'subscription.disable':
        console.log('Subscription cancelled:', event.data.reference);
        // TODO: Handle subscription cancellation
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    // Always respond 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    // Still respond 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(event: PaystackWebhookEvent) {
  try {
    // Additional verification: Query Paystack API to confirm payment
    const verification = await verifyPaystackTransaction(event.data.reference);

    if (!verification.success || verification.data?.status !== 'success') {
      console.warn('Payment verification failed:', event.data.reference);
      return;
    }

    const { customer, amount, reference, metadata, paid_at, authorization } = event.data;

    // Debug: Log what we received from webhook
    console.log('=== WEBHOOK DEBUG ===');
    console.log('Customer email:', customer.email);
    console.log('Customer name:', `${customer.first_name} ${customer.last_name}`);
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
    console.log('====================');

    const customerEmail = customer.email;
    const customerName = `${customer.first_name} ${customer.last_name}`.trim();

    console.log(`Payment confirmed for ${customerEmail} - ${formatPaystackAmount(amount)}`);
    console.log(`Will send receipt email to: ${customerEmail}`);

    // Enable recurring subscription if authorization code is available
    if (authorization?.authorization_code) {
      const subscriptionResult = await enableRecurringSubscription(
        authorization.authorization_code,
        customerEmail
      );

      if (subscriptionResult.success) {
        console.log(`Recurring subscription enabled for ${customerEmail}`);
        console.log(`Subscription code: ${subscriptionResult.subscriptionCode}`);
      } else {
        console.warn(`Failed to enable recurring subscription: ${subscriptionResult.error}`);
      }
    }

    // Prepare email data with card details
    const emailData = {
      name: customerName,
      email: customerEmail,
      amount: formatPaystackAmount(amount),
      paymentDate: new Date(paid_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      subscriptionToken: authorization?.authorization_code || reference,
      reference: reference,
      cardLast4: authorization?.last4,
      cardType: authorization?.card_type,
    };

    // Send payment confirmation emails asynchronously
    Promise.all([
      sendPaymentConfirmationEmail(emailData),
      sendPaymentReceivedNotification(emailData),
    ]).catch((error) => {
      console.error('Failed to send payment confirmation emails:', error);
      // Log but don't fail the webhook
    });

    // TODO: Update member status in database
    // Example:
    // await db.members.update({
    //   where: { email: customer.email },
    //   data: {
    //     status: 'ACTIVE',
    //     subscriptionReference: reference,
    //     authorizationCode: authorization?.authorization_code,
    //     subscriptionCode: subscriptionResult?.subscriptionCode,
    //     lastPaymentDate: new Date(paid_at),
    //   }
    // });

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: PaystackWebhookEvent) {
  try {
    const { customer, gateway_response, reference, amount } = event.data;

    const customerEmail = customer.email;
    const customerName = `${customer.first_name} ${customer.last_name}`.trim();

    console.log(`Payment failed for ${customerEmail} - Reason: ${gateway_response}`);

    // Send payment failed notification to user
    const emailData = {
      name: customerName,
      email: customerEmail,
      amount: formatPaystackAmount(amount),
      reference: reference,
      reason: gateway_response || 'Payment could not be processed',
    };

    sendPaymentFailedEmail(emailData).catch((error) => {
      console.error('Failed to send payment failed email:', error);
    });

    // TODO: Update member status in database
    // Example:
    // await db.members.update({
    //   where: { email: customer.email },
    //   data: {
    //     lastPaymentAttempt: new Date(),
    //     lastPaymentError: gateway_response,
    //   }
    // });

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
