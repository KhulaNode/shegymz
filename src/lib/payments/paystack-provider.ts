import crypto from 'crypto';
import type {
  IPaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  VerifyPaymentOutput,
  PaymentStatus,
} from './types';
import { getPlan } from './plans';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: 'success' | 'failed' | 'abandoned' | string;
    reference: string;
    paid_at?: string;
  };
}

/**
 * Implements the payment provider interface using Paystack.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY
 *   APP_BASE_URL
 * Optional env vars:
 *   PAYSTACK_PLAN_CODE
 */
export class PaystackProvider implements IPaymentProvider {
  private get secretKey(): string {
    return process.env.PAYSTACK_SECRET_KEY ?? '';
  }

  private get baseUrl(): string {
    return (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    if (!this.secretKey) {
      return { success: false, error: 'PAYSTACK_SECRET_KEY is not configured' };
    }

    const plan = getPlan(input.planId);
    if (!plan) {
      return { success: false, error: `Unknown plan: ${input.planId}` };
    }

    const payload: Record<string, unknown> = {
      email: input.metadata.email,
      amount: plan.amountCents,
      currency: plan.currency,
      callback_url: `${this.baseUrl}/payment-success?ref=${input.paymentRecordId}`,
      reference: input.paymentRecordId,
      metadata: {
        paymentRecordId: input.paymentRecordId,
        userId: input.userId,
        planId: input.planId,
        name: input.metadata.name,
        email: input.metadata.email,
        phone: input.metadata.phone,
        bodyGoals: input.metadata.bodyGoals ?? '',
        referralName: input.metadata.referralName ?? '',
      },
    };

    const planCode = process.env.PAYSTACK_PLAN_CODE?.trim();
    if (planCode) {
      payload.plan = planCode;
    }

    try {
      const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as PaystackInitializeResponse;
      if (!response.ok || !data.status || !data.data?.authorization_url || !data.data.reference) {
        return {
          success: false,
          error: data.message || `Paystack API error ${response.status}`,
        };
      }

      return {
        success: true,
        checkoutUrl: data.data.authorization_url,
        providerReference: data.data.reference,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: `Failed to create Paystack checkout: ${message}` };
    }
  }

  async verifyPayment(providerReference: string): Promise<VerifyPaymentOutput> {
    if (!this.secretKey) {
      return { success: false, error: 'PAYSTACK_SECRET_KEY is not configured' };
    }

    try {
      const response = await fetch(
        `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(providerReference)}`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        },
      );

      const data = (await response.json().catch(() => ({}))) as PaystackVerifyResponse;
      if (!response.ok || !data.status || !data.data) {
        return {
          success: false,
          error: data.message || `Paystack API error ${response.status}`,
        };
      }

      const statusMap: Record<string, PaymentStatus> = {
        success: 'paid',
        failed: 'failed',
        abandoned: 'cancelled',
      };
      const status = statusMap[data.data.status] ?? 'pending';

      return { success: true, status, paidAt: data.data.paid_at };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: `Failed to verify Paystack payment: ${message}` };
    }
  }

  static verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
    if (!secret || !signatureHeader) return false;

    const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader, 'utf8'),
        Buffer.from(expectedSignature, 'utf8'),
      );
    } catch {
      return false;
    }
  }
}
