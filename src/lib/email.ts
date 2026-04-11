/**
 * Email Service using Plunk
 *
 * Calls the Plunk transactional email API directly via fetch.
 * API docs: https://docs.useplunk.com/api-reference/transactional/send-transactional-email
 */

const PLUNK_API_URL = 'https://next-api.useplunk.com/v1/send';

async function sendEmail(opts: { to: string; subject: string; body: string; from?: string }) {
  const apiKey = process.env.PLUNK_API_KEY;
  if (!apiKey) {
    console.error('[email] PLUNK_API_KEY is not set');
    throw new Error('PLUNK_API_KEY is not configured');
  }

  const from =
    opts.from ??
    process.env.PLUNK_FROM_EMAIL ??
    process.env.ADMIN_EMAIL ??
    'hello@shegymz.com';

  const res = await fetch(PLUNK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ to: opts.to, subject: opts.subject, body: opts.body, from }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[email] Plunk API error ${res.status}:`, text);
    throw new Error(`Plunk API error ${res.status}: ${text}`);
  }

  return res.json();
}

interface SubscriptionEmailData {
  name: string;
  email: string;
  phone: string;
  bodyGoals?: string;
  referralName?: string;
  paymentLink?: string;
}

interface PaymentConfirmationEmailData {
  name: string;
  email: string;
  amount: string;
  paymentDate: string;
  subscriptionToken?: string;
  reference?: string;
  cardLast4?: string;
  cardType?: string;
}

/**
 * Send notification to admin when a new subscription form is submitted
 */
export async function sendNewSubscriptionNotification(
  data: SubscriptionEmailData
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Subscription Request</h2>
        <p>A new member has submitted a subscription request:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          ${data.bodyGoals ? `<p><strong>Body Goals:</strong> ${data.bodyGoals}</p>` : ''}
          ${data.referralName ? `<p><strong>Referred By:</strong> ${data.referralName}</p>` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from SheGymz subscription system.
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New Subscription: ${data.name}`,
      body: emailBody,
    });

    console.log(`Admin notification sent for subscription: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // Don't throw - email failures shouldn't break the subscription flow
    return false;
  }
}

/**
 * Send welcome email to user when they submit the subscription form
 */
export async function sendSubscriptionInitiatedEmail(
  data: SubscriptionEmailData
): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E91E63;">Welcome to SheGymz! 💪</h2>
        <p>Hi ${data.name},</p>
        
        <p>Thank you for starting your subscription with SheGymz! We're excited to have you join our community.</p>
        
        ${data.paymentLink ? `
        <div style="background-color: #E91E63; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">Complete Your Subscription</h3>
          <p style="color: white; margin-bottom: 20px;">Click the button below to set up your recurring monthly membership</p>
          <a href="${data.paymentLink}" style="display: inline-block; background-color: white; color: #E91E63; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Complete Payment</a>
        </div>
        ` : ''}
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">What Happens Next:</h3>
          <ol style="color: #555;">
            <li>Click the payment button above to complete your subscription</li>
            <li>Set up your recurring monthly payment (R399/month)</li>
            <li>You'll receive a confirmation email once payment is processed</li>
            <li>Access your membership benefits immediately</li>
          </ol>
        </div>
        
        ${data.bodyGoals ? `
        <p><strong>Your Body Goals:</strong></p>
        <p style="font-style: italic; color: #666;">"${data.bodyGoals}"</p>
        <p>We'll help you achieve these goals! 🎯</p>
        ` : ''}
        
        <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us.</p>
        
        <p>Stay strong,<br><strong>The SheGymz Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent because you initiated a subscription at SheGymz.
        </p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Welcome to SheGymz - Complete Your Payment',
      body: emailBody,
    });

    console.log(`Welcome email sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send payment receipt email to the member
 * Custom branded receipt for SheGymz
 */
export async function sendPaymentConfirmationEmail(
  data: PaymentConfirmationEmailData
): Promise<boolean> {
  try {
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #2d2d2d;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #2d2d2d; color: #ffffff;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 30px 20px;">
            <div style="background-color: #4a90e2; width: 60px; height: 60px; margin: 0 auto 20px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">💪</span>
            </div>
            <p style="color: #999; margin: 0; font-size: 14px;">If you have any issues with payment, kindly reply to this email or send an email to</p>
            <a href="mailto:${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}" style="color: #4a90e2; text-decoration: none; font-size: 14px;">${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}</a>
          </div>

          <!-- Success Banner -->
          <div style="background-color: #d32f2f; padding: 20px; text-align: center; margin: 0 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px; font-weight: 500;">This receipt is for a confirmed transaction.</p>
          </div>

          <!-- Amount Section -->
          <div style="background-color: #4a6fa5; padding: 40px 20px; text-align: center; margin: 0 20px;">
            <p style="margin: 0 0 10px 0; font-size: 18px; color: #ffffff;">SheGymz received your payment of</p>
            <h1 style="margin: 0; font-size: 48px; font-weight: bold; color: #ffffff;">${data.amount}</h1>
          </div>

          <!-- Transaction Details -->
          <div style="background-color: #3d3d3d; padding: 30px 20px; margin: 0 20px;">
            <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 500; color: #ffffff; text-align: center;">Transaction Details</h2>
            
            <div style="border-top: 1px solid #555;">
              <div style="padding: 15px 0; border-bottom: 1px solid #555; display: flex; justify-content: space-between;">
                <span style="color: #ffffff;">Reference</span>
                <span style="color: #ffffff; font-weight: 500;">${data.reference || data.subscriptionToken || 'N/A'}</span>
              </div>
              
              <div style="padding: 15px 0; border-bottom: 1px solid #555; display: flex; justify-content: space-between;">
                <span style="color: #ffffff;">Date</span>
                <span style="color: #ffffff; font-weight: 500;">${data.paymentDate}</span>
              </div>
              
              ${data.cardLast4 ? `
              <div style="padding: 15px 0; border-bottom: 1px solid #555; display: flex; justify-content: space-between;">
                <span style="color: #ffffff;">Card</span>
                <span style="color: #ffffff; font-weight: 500;">
                  ${data.cardType ? `<img src="https://img.icons8.com/color/20/000000/visa.png" alt="${data.cardType}" style="vertical-align: middle; margin-right: 5px;">` : ''}
                  Ending with ${data.cardLast4}
                </span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 500;">SheGymz</span>
            </div>
            <a href="mailto:${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}" style="color: #4a90e2; text-decoration: none; font-size: 14px;">${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}</a>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #555;">
              <p style="color: #999; font-size: 14px; margin: 0;">Your recurring monthly subscription is now active</p>
              <p style="color: #999; font-size: 14px; margin: 10px 0 0 0;">Visit the gym anytime during operating hours</p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Payment Receipt - SheGymz Membership',
      body: emailBody,
    });

    console.log(`Payment receipt sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment receipt:', error);
    return false;
  }
}

/**
 * Send admin notification when payment is received
 */
export async function sendPaymentReceivedNotification(
  data: PaymentConfirmationEmailData
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Payment Received ✅</h2>
        <p>A payment has been successfully processed:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Member:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Amount:</strong> ${data.amount}</p>
          <p><strong>Date:</strong> ${data.paymentDate}</p>
          ${data.subscriptionToken ? `<p><strong>Token:</strong> ${data.subscriptionToken}</p>` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Member has been sent a confirmation email.
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `Payment Received: ${data.name} - ${data.amount}`,
      body: emailBody,
    });

    console.log(`Admin payment notification sent: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send admin payment notification:', error);
    return false;
  }
}

/**
 * Send payment failed notification to user
 */
export async function sendPaymentFailedEmail(
  data: {
    name: string;
    email: string;
    amount: string;
    reference: string;
    reason?: string;
  }
): Promise<boolean> {
  try {
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: #d32f2f; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${data.name},</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Unfortunately, your payment for SheGymz membership could not be processed.
            </p>

            ${data.reason ? `
            <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${data.reason}</p>
            </div>
            ` : ''}

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ${data.amount}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Reference:</strong> ${data.reference}</p>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1976d2;">What to do next:</h3>
              <ul style="color: #1565c0; line-height: 1.8;">
                <li>Check that your card has sufficient funds</li>
                <li>Verify your card details are correct</li>
                <li>Contact your bank if the issue persists</li>
                <li>Try again with a different payment method</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 15px;">Need help? Contact us:</p>
              <a href="mailto:${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}" 
                 style="display: inline-block; background-color: #E91E63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Contact Support
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>The SheGymz Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              This is an automated notification from SheGymz
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Payment Failed - SheGymz Membership',
      body: emailBody,
    });

    console.log(`Payment failed notification sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return false;
  }
}

/**
 * Send free trial request notification to admin
 */
export async function sendFreeTrialRequestEmail(data: {
  name: string;
  email: string;
  phone: string;
  bodyGoals?: string;
  referralName?: string;
}): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E91E63;">New Free Trial Request 🎉</h2>
        <p>Someone has requested a free trial membership:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          ${data.bodyGoals ? `<p><strong>Body Goals:</strong> ${data.bodyGoals}</p>` : ''}
          ${data.referralName ? `<p><strong>Referred By:</strong> ${data.referralName}</p>` : ''}
        </div>

        <p style="color: #666; font-size: 14px;">
          Submitted on ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
        </p>
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from the SheGymz free trial system.
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `Free Trial Request: ${data.name}`,
      body: emailBody,
    });

    console.log(`Free trial request email sent for: ${data.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send free trial request email:', error);
    return false;
  }
}

/**
 * Send generic form submission email (for contact forms, etc.)
 */
export async function sendFormSubmissionEmail(
  formData: Record<string, string>,
  formType: string = 'Contact Form'
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';
    
    const formFields = Object.entries(formData)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join('\n');
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New ${formType} Submission</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${formFields}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Submitted on ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New ${formType} Submission`,
      body: emailBody,
    });

    console.log(`Form submission email sent: ${formType}`);
    return true;
  } catch (error) {
    console.error('Failed to send form submission email:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activation & Reminder Emails
// ─────────────────────────────────────────────────────────────────────────────

interface ActivationEmailData {
  name: string;
  email: string;
  activationUrl: string;
  amount?: string;
  paymentDate?: string;
  reference?: string;
}

/**
 * Sent after verified payment — contains the one-time account activation link.
 */
export async function sendActivationEmail(data: ActivationEmailData): Promise<boolean> {
  try {
    const appName  = 'SheGymZ';
    const contact  = process.env.CONTACT_EMAIL || 'admin@shegymz.com';

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f9f9f9;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">

          <!-- Header -->
          <div style="background:#4b0d6b;padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:-0.5px;">${appName}</h1>
            <p style="margin:8px 0 0;color:#d8b4fe;font-size:14px;">Private Women&apos;s Wellness Club</p>
          </div>

          <!-- Body -->
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;">Payment Confirmed — Activate Your Account</h2>
            <p style="color:#555;font-size:15px;margin:0 0 24px;">Hi ${data.name},</p>
            <p style="color:#555;font-size:15px;margin:0 0 24px;">
              Your payment has been confirmed. ${data.amount ? `<strong>${data.amount}</strong> received on ${data.paymentDate ?? ''}.` : ''}
              You&apos;re almost in — click the button below to set up your account.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${data.activationUrl}"
                 style="display:inline-block;background:#4b0d6b;color:#fff;padding:14px 36px;
                        text-decoration:none;border-radius:6px;font-weight:700;font-size:16px;
                        letter-spacing:-0.2px;">
                Activate My Account
              </a>
            </div>

            <!-- What to expect -->
            <div style="background:#f5f0ff;border-radius:6px;padding:20px;margin:0 0 24px;">
              <p style="margin:0 0 10px;font-weight:600;color:#4b0d6b;">What happens next:</p>
              <ol style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.7;">
                <li>Click the button above</li>
                <li>Choose Google SSO <em>or</em> set a password</li>
                <li>You&apos;re in — enjoy your SheGymZ membership!</li>
              </ol>
            </div>

            <p style="color:#888;font-size:13px;margin:0 0 8px;">
              This link expires in ${process.env.ACTIVATION_TOKEN_EXPIRES_HOURS ?? '48'} hours.
              If you did not request this, contact us at
              <a href="mailto:${contact}" style="color:#4b0d6b;">${contact}</a>.
            </p>
            ${data.reference ? `<p style="color:#aaa;font-size:12px;margin:0;">Reference: ${data.reference}</p>` : ''}
          </div>

          <!-- Footer -->
          <div style="background:#fafafa;border-top:1px solid #eee;padding:16px 24px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: data.email,
      subject: `${appName} — Activate your account`,
      body: emailBody,
    });

    console.log(`[email] Activation email sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send activation email:', (error as Error).message);
    return false;
  }
}

/**
 * Reminder for unpaid intents — resend the payment link.
 */
export async function sendPaymentReminderEmail(data: {
  name: string;
  email: string;
  paymentLink: string;
  unsubscribeUrl?: string;
}): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#4b0d6b;">Complete Your SheGymZ Membership</h2>
        <p>Hi ${data.name},</p>
        <p>You started a membership request but haven&apos;t completed payment yet. Your spot is still available!</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${data.paymentLink}"
             style="display:inline-block;background:#4b0d6b;color:#fff;padding:14px 32px;
                    text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;">
            Complete Payment
          </a>
        </div>
        <p style="color:#888;font-size:13px;">
          If you no longer wish to receive reminders,
          ${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#888;">click here to unsubscribe</a>.` : 'reply to this email.'}
        </p>
        <p>— The SheGymZ Team</p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'SheGymZ — Complete your membership payment',
      body: emailBody,
    });

    console.log(`[email] Payment reminder sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send payment reminder:', (error as Error).message);
    return false;
  }
}

/**
 * Reminder for paid-but-not-yet-activated intents — resend a fresh activation link.
 */
export async function sendActivationReminderEmail(data: {
  name: string;
  email: string;
  activationUrl: string;
}): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#4b0d6b;">Your SheGymZ Account is Waiting</h2>
        <p>Hi ${data.name},</p>
        <p>Your payment is confirmed but you haven&apos;t activated your account yet. Here&apos;s a fresh activation link:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${data.activationUrl}"
             style="display:inline-block;background:#4b0d6b;color:#fff;padding:14px 32px;
                    text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;">
            Activate My Account
          </a>
        </div>
        <p style="color:#888;font-size:13px;">
          This link expires in ${process.env.ACTIVATION_TOKEN_EXPIRES_HOURS ?? '48'} hours.
          If you need help, contact us at ${process.env.CONTACT_EMAIL || 'admin@shegymz.com'}.
        </p>
        <p>— The SheGymZ Team</p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'SheGymZ — Activate your account (reminder)',
      body: emailBody,
    });

    console.log(`[email] Activation reminder sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send activation reminder:', (error as Error).message);
    return false;
  }
}
