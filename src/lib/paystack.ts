/**
 * Paystack Integration Service
 *
 * Handles subscription payments through Paystack.
 * 
 * Features:
 * - Initialize subscription transactions
 * - Verify payments
 * - Handle webhooks
 * - Manage subscriptions
 * 
 * Setup:
 * 1. Get your keys from https://dashboard.paystack.com/#/settings/developers
 * 2. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local
 * 3. Set up webhook URL in Paystack dashboard
 * 
 * Production considerations:
 * - Never expose secret key to client
 * - Verify all webhook signatures
 * - Store subscription data in database
 * - Implement idempotency for webhook handling
 * - Add proper error logging and monitoring
 */

import crypto from 'crypto';
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * Create or get a Paystack customer
 * Uses notification email for Paystack, stores real customer data in metadata
 */
async function createOrGetPaystackCustomer(data: {
  name: string;
  email: string;
  phone: string;
  bodyGoals?: string;
  referralName?: string;
}): Promise<{ success: boolean; customer_code?: string; error?: string }> {
  try {
    const [firstName, ...lastNameParts] = data.name.split(' ');
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : '';

    // Create customer with their real email
    const payload = {
      email: data.email,
      first_name: firstName,
      last_name: lastName,
      phone: data.phone,
      metadata: {
        body_goals: data.bodyGoals || '',
        referral_name: data.referralName || '',
        created_at: new Date().toISOString(),
      },
    };

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/customer`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        customer_code: response.data.data.customer_code,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to create customer',
      };
    }
  } catch (error: any) {
    // Customer might already exist, try to fetch
    if (error.response?.data?.message?.includes('already exists')) {
      try {
        // Fetch existing customer by email
        const fetchResponse = await axios.get(
          `${PAYSTACK_BASE_URL}/customer/${encodeURIComponent(data.email)}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        
        if (fetchResponse.data.status) {
          return {
            success: true,
            customer_code: fetchResponse.data.data.customer_code,
          };
        }
      } catch (fetchError) {
        console.error('Error fetching existing customer:', fetchError);
      }
    }
    
    console.error('Paystack customer creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create customer',
    };
  }
}

interface SubscriptionData {
  name: string;
  email: string;
  phone: string;
  bodyGoals?: string;
  referralName?: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

/**
 * Initialize a Paystack transaction for subscription
 * Returns the authorization URL to redirect the user to
 * 
 * For recurring subscriptions, this initializes a transaction that will
 * be linked to a subscription plan after successful payment.
 */
export async function initializePaystackSubscription(
  data: SubscriptionData
): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> {
  try {
    // First, create or get customer in Paystack
    const customerResult = await createOrGetPaystackCustomer(data);
    
    if (!customerResult.success || !customerResult.customer_code) {
      return {
        success: false,
        error: customerResult.error || 'Failed to create customer',
      };
    }

    const amount = parseFloat(process.env.NEXT_PUBLIC_SUBSCRIPTION_AMOUNT || '399') * 100; // Paystack uses kobo (cents)
    const callbackUrl = process.env.NEXT_PUBLIC_PAYSTACK_CALLBACK_URL || 'http://localhost:3000/payment-success';
    
    // Generate unique reference
    const reference = `SUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const [firstName, ...lastNameParts] = data.name.split(' ');
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : '';

    // For recurring subscriptions, we'll use a plan code if set, or one-time with intention to subscribe
    const planCode = process.env.PAYSTACK_PLAN_CODE; // Optional: Create a plan in Paystack dashboard

    const payload: any = {
      email: data.email, // Required field
      customer: customerResult.customer_code, // Link to customer
      amount: amount,
      reference: reference,
      callback_url: callbackUrl,
      currency: 'ZAR', // South African Rand
      metadata: {
        custom_fields: [
          {
            display_name: 'Full Name',
            variable_name: 'full_name',
            value: data.name,
          },
          {
            display_name: 'Phone',
            variable_name: 'phone',
            value: data.phone,
          },
          ...(data.bodyGoals ? [{
            display_name: 'Body Goals',
            variable_name: 'body_goals',
            value: data.bodyGoals,
          }] : []),
          ...(data.referralName ? [{
            display_name: 'Referred By',
            variable_name: 'referral_name',
            value: data.referralName,
          }] : []),
        ],
        first_name: firstName,
        last_name: lastName,
        phone: data.phone,
        body_goals: data.bodyGoals || '',
        referral_name: data.referralName || '',
        subscription_type: 'recurring', // Mark as recurring subscription
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money'], // Payment methods available
    };

    // If a plan code is configured, use it for subscription
    if (planCode) {
      payload.plan = planCode;
    }

    const response = await axios.post<PaystackInitializeResponse>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to initialize payment',
      };
    }
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to initialize payment',
    };
  }
}

/**
 * Verify a Paystack transaction
 * Call this after user returns from payment or in webhook
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<{ success: boolean; data?: PaystackVerifyResponse['data']; error?: string }> {
  try {
    const response = await axios.get<PaystackVerifyResponse>(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Payment verification failed',
      };
    }
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to verify payment',
    };
  }
}

/**
 * Verify Paystack webhook signature
 * CRITICAL: Always verify webhook signatures in production
 */
export function verifyPaystackWebhook(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Parse Paystack webhook payload
 */
export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
      // Real customer data (when using notification email)
      real_customer_email?: string;
      real_customer_name?: string;
      real_customer_phone?: string;
      // Standard fields
      first_name?: string;
      last_name?: string;
      phone?: string;
      body_goals?: string;
      referral_name?: string;
      subscription_type?: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

/**
 * Helper to format amount from kobo to currency
 */
export function formatPaystackAmount(amountInKobo: number): string {
  return `R${(amountInKobo / 100).toFixed(2)}`;
}

/**
 * Create a subscription after successful payment
 * This enables automatic recurring charges using the authorization code
 */
export async function enableRecurringSubscription(
  authorizationCode: string,
  email: string
): Promise<{ success: boolean; subscriptionCode?: string; error?: string }> {
  try {
    // Create or get customer
    const customerResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/customer`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const customerCode = customerResponse.data.data.customer_code;

    // If you have a plan code, use it to create subscription
    const planCode = process.env.PAYSTACK_PLAN_CODE;
    
    if (planCode) {
      const subscriptionResult = await createPaystackSubscription(customerCode, planCode);
      if (subscriptionResult.success) {
        return {
          success: true,
          subscriptionCode: subscriptionResult.data?.subscription_code,
        };
      }
    }

    // If no plan code, we'll rely on the authorization code for future charges
    return {
      success: true,
      subscriptionCode: authorizationCode,
    };
  } catch (error: any) {
    console.error('Enable recurring subscription error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to enable recurring subscription',
    };
  }
}

/**
 * Create a subscription plan (optional - for recurring payments)
 * This is for setting up recurring subscriptions
 */
export async function createPaystackSubscription(
  customerCode: string,
  planCode: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/subscription`,
      {
        customer: customerCode,
        plan: planCode,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to create subscription',
      };
    }
  } catch (error: any) {
    console.error('Paystack subscription creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create subscription',
    };
  }
}
