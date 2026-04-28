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

interface PaymentEmailData {
  name: string;
  email: string;
  amount: string;
  paymentDate?: string;
  reference: string;
  reason?: string;
}

function portalUrl() {
  return process.env.PORTAL_URL?.trim() || 'https://portal.shegymz.com';
}

export async function sendNewSubscriptionNotification(
  data: SubscriptionEmailData,
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Subscription Request</h2>
        <p>A new member started the subscription flow.</p>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          ${data.bodyGoals ? `<p><strong>Body Goals:</strong> ${data.bodyGoals}</p>` : ''}
          ${data.referralName ? `<p><strong>Referred By:</strong> ${data.referralName}</p>` : ''}
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New Subscription: ${data.name}`,
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send admin subscription notification:', error);
    return false;
  }
}

export async function sendSubscriptionInitiatedEmail(
  data: SubscriptionEmailData,
): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#E91E63;">Welcome to SheGymZ</h2>
        <p>Hi ${data.name},</p>
        <p>Your subscription has been started. Complete your payment using the link below.</p>
        ${data.paymentLink ? `
          <p style="margin:24px 0;">
            <a href="${data.paymentLink}" style="display:inline-block;background:#E91E63;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
              Complete Payment
            </a>
          </p>
        ` : ''}
        <p>Once payment succeeds, you will receive your portal link.</p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Complete Your SheGymZ Subscription',
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send subscription initiated email:', error);
    return false;
  }
}

export async function sendPaymentSuccessEmail(data: PaymentEmailData): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#2e7d32;">Your SheGymZ Subscription Is Active</h2>
        <p>Hi ${data.name},</p>
        <p>Your payment of <strong>${data.amount}</strong> has been confirmed.</p>
        ${data.paymentDate ? `<p><strong>Payment Date:</strong> ${data.paymentDate}</p>` : ''}
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p>Your next step is to access the member portal.</p>
        <p style="margin:24px 0;">
          <a href="${portalUrl()}" style="display:inline-block;background:#E91E63;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
            Open SheGymZ Portal
          </a>
        </p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Your SheGymZ Portal Is Ready',
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send payment success email:', error);
    return false;
  }
}

export async function sendPaymentReceivedNotification(data: PaymentEmailData): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shegymz.com';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Received</h2>
        <p>A SheGymZ subscription payment has been confirmed.</p>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Amount:</strong> ${data.amount}</p>
          ${data.paymentDate ? `<p><strong>Date:</strong> ${data.paymentDate}</p>` : ''}
          <p><strong>Reference:</strong> ${data.reference}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `Payment Received: ${data.name}`,
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send admin payment notification:', error);
    return false;
  }
}

export async function sendPaymentFailedEmail(data: PaymentEmailData): Promise<boolean> {
  try {
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#d32f2f;">Payment Failed</h2>
        <p>Hi ${data.name},</p>
        <p>Your payment for SheGymZ could not be completed.</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Reference:</strong> ${data.reference}</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p style="margin-top:24px;">
          <a href="${process.env.APP_BASE_URL?.replace(/\/$/, '') || 'https://shegymz.com'}/subscribe" style="display:inline-block;background:#E91E63;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
            Try Again
          </a>
        </p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Payment Failed - SheGymZ',
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send payment failed email:', error);
    return false;
  }
}

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
        <h2 style="color:#E91E63;">New Free Trial Request</h2>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          ${data.bodyGoals ? `<p><strong>Body Goals:</strong> ${data.bodyGoals}</p>` : ''}
          ${data.referralName ? `<p><strong>Referred By:</strong> ${data.referralName}</p>` : ''}
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `Free Trial Request: ${data.name}`,
      body: emailBody,
    });
    return true;
  } catch (error) {
    console.error('[email] Failed to send free trial request email:', error);
    return false;
  }
}
