import { NextRequest, NextResponse } from 'next/server';
import { parsePayFastITN, verifyPayFastSignature } from '@/lib/payfast';
import { 
  sendPaymentConfirmationEmail, 
  sendPaymentReceivedNotification 
} from '@/lib/email';

/**
 * POST /api/webhook/payfast
 *
 * PayFast Instant Transaction Notification (ITN) webhook handler.
 *
 * IMPORTANT SECURITY NOTES:
 * 1. ALWAYS verify the signature before processing
 * 2. ALWAYS verify the merchant ID matches
 * 3. ALWAYS query PayFast to confirm payment status
 * 4. ALWAYS use HTTPS in production
 * 5. Do NOT trust the notification alone - verify independently
 *
 * TODO (Production - HIGH PRIORITY):
 * - Implement proper ITN signature verification
 * - Query PayFast API to verify payment status
 * - Store webhook payload in audit log
 * - Implement idempotency (handle duplicate webhooks)
 * - Update membership status in database
 * - Send confirmation emails
 * - Implement proper error logging
 * - Add request validation and rate limiting
 * - Ensure HTTPS only
 *
 * ITN Webhook Integration Steps:
 * 1. Verify signature matches expected signature
 * 2. Verify merchant ID is correct
 * 3. Log webhook payload (for debugging)
 * 4. Query PayFast API with transaction ID to verify amount & status
 * 5. Update member status in database (if payment confirmed)
 * 6. Send success/failure notification emails
 * 7. Respond with 200 OK to confirm receipt
 *
 * Reference: https://www.payfast.co.za/documentation/
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw form data from PayFast
    const formData = await request.formData();
    const itnData: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      itnData[key] = value as string;
    }

    // Extract signature
    const signature = itnData.signature || '';
    delete itnData.signature;

    // SECURITY: Verify signature
    // WARNING: In production, always verify signatures
    const isSignatureValid = verifyPayFastSignature(itnData, signature);

    if (!isSignatureValid) {
      console.warn('Invalid PayFast signature received');
      // Still respond 200 to prevent PayFast resending
      return NextResponse.json({ success: false, error: 'Signature verification failed' });
    }

    // Parse ITN payload
    const itn = parsePayFastITN(itnData);

    // Verify merchant ID
    const expectedMerchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '10000100';
    if (itnData.merchant_id !== expectedMerchantId) {
      console.warn('Merchant ID mismatch in ITN');
      return NextResponse.json({ success: false, error: 'Merchant ID mismatch' });
    }

    /**
     * TODO: In production, implement:
     *
     * 1. Verify payment with PayFast API:
     *    - Use PayFast API to query transaction status
     *    - Verify amount matches subscription amount
     *    - Confirm payment_status is COMPLETE
     *
     * 2. Update database:
     *    - Find member by email
     *    - Mark membership as active
     *    - Store payment token for future recurring charges
     *    - Log transaction in audit table
     *
     * 3. Send communications:
     *    - Email confirmation to member
     *    - Email notification to admin
     *    - Schedule follow-up communications
     *
     * 4. Error handling:
     *    - Log all errors to observability platform
     *    - Implement retry logic for database operations
     *    - Handle race conditions (multiple webhooks)
     *
     * Sample logic (NOT production ready):
     */

    // Log the webhook (in production, store in database)
    console.log('PayFast ITN received:', {
      merchant_id: itnData.merchant_id,
      pf_payment_id: itn.pf_payment_id,
      payment_status: itn.payment_status,
      email: itn.email_address,
      amount: itn.amount_gross,
      timestamp: new Date().toISOString(),
    });

    // For now, just confirm receipt
    // Production: actually process the payment and update member status
    if (itn.payment_status === 'COMPLETE') {
      console.log(`Payment confirmed for ${itn.email_address}`);
      
      // Send payment confirmation emails
      const emailData = {
        name: itn.name_first + (itn.name_last ? ` ${itn.name_last}` : ''),
        email: itn.email_address,
        amount: `R${parseFloat(itn.amount_gross).toFixed(2)}`,
        paymentDate: new Date().toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        subscriptionToken: itn.token,
      };

      // Send emails asynchronously (don't block webhook response)
      Promise.all([
        sendPaymentConfirmationEmail(emailData),
        sendPaymentReceivedNotification(emailData),
      ]).catch((error) => {
        console.error('Failed to send payment confirmation emails:', error);
        // Log but don't fail the webhook
      });

      // TODO: Update member status to ACTIVE in database
    } else if (itn.payment_status === 'FAILED') {
      console.log(`Payment failed for ${itn.email_address}`);
      // TODO: Mark membership request as failed, send notification
    }

    // Always respond 200 OK to confirm receipt
    // PayFast will stop sending ITN after confirmation
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ITN webhook error:', error);
    // Still respond 200 to prevent PayFast resending
    return NextResponse.json({ success: false, error: 'Processing error' });
  }
}
