import crypto from 'crypto';
import type {
  IPaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  VerifyPaymentOutput,
  PaymentStatus,
} from './types';
import { getPlan } from './plans';

const YOCO_API_BASE = 'https://payments.yoco.com/api';

interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
}

interface YocoCheckoutStatusResponse {
  id: string;
  /** Yoco statuses: pending | complete | failed | cancelled */
  status: string;
  completedAt?: string;
}

/**
 * YocoProvider
 *
 * Implements the payment provider interface using Yoco Online Payments API.
 * https://developer.yoco.com/online/resources/integration-objects/checkout
 *
 * Required env vars (see .env.example):
 *   YOCO_SECRET_KEY      — sk_test_... or sk_live_... (never committed)
 *   YOCO_WEBHOOK_SECRET  — shared secret for webhook signature verification
 *   APP_BASE_URL         — base URL for success/cancel redirect callbacks
 *
 * Currency: ZAR (cents).  Amount comes from plan definition — never hardcoded here.
 */
export class YocoProvider implements IPaymentProvider {
  private get secretKey(): string {
    return process.env.YOCO_SECRET_KEY ?? '';
  }

  private get baseUrl(): string {
    return (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    if (!this.secretKey) {
      return { success: false, error: 'YOCO_SECRET_KEY is not configured' };
    }

    const plan = getPlan(input.planId);
    if (!plan) {
      return { success: false, error: `Unknown plan: ${input.planId}` };
    }

    const body = {
      amount: plan.amountCents,
      currency: plan.currency,
      cancelUrl: `${this.baseUrl}/payment-cancelled?ref=${input.paymentRecordId}`,
      successUrl: `${this.baseUrl}/payment-success?ref=${input.paymentRecordId}`,
      failureUrl: `${this.baseUrl}/payment-cancelled?ref=${input.paymentRecordId}&reason=failure`,
      /**
       * metadata is echoed back in the Yoco webhook payload —
       * paymentRecordId lets us look up our internal record without a
       * separate reference lookup table.
       */
      metadata: {
        paymentRecordId: input.paymentRecordId,
        userId: input.userId,
        planId: input.planId,
        name: input.metadata.name,
        phone: input.metadata.phone,
        bodyGoals: input.metadata.bodyGoals ?? '',
        referralName: input.metadata.referralName ?? '',
      },
    };

    try {
      const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          errorMessage?: string;
          displayMessage?: string;
        };
        return {
          success: false,
          error:
            errData.errorMessage ??
            errData.displayMessage ??
            `Yoco API error ${response.status}`,
        };
      }

      const data = (await response.json()) as YocoCheckoutResponse;
      return {
        success: true,
        checkoutUrl: data.redirectUrl,
        providerReference: data.id,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: `Failed to create Yoco checkout: ${message}` };
    }
  }

  async verifyPayment(providerReference: string): Promise<VerifyPaymentOutput> {
    if (!this.secretKey) {
      return { success: false, error: 'YOCO_SECRET_KEY is not configured' };
    }

    try {
      const response = await fetch(`${YOCO_API_BASE}/checkouts/${providerReference}`, {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      });

      if (!response.ok) {
        return { success: false, error: `Yoco API error ${response.status}` };
      }

      const data = (await response.json()) as YocoCheckoutStatusResponse;

      const statusMap: Record<string, PaymentStatus> = {
        complete: 'paid',
        failed: 'failed',
        cancelled: 'cancelled',
      };
      const status: PaymentStatus = statusMap[data.status] ?? 'pending';

      return { success: true, status, paidAt: data.completedAt };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: `Failed to verify Yoco payment: ${message}` };
    }
  }

  /**
   * Verify a Yoco webhook signature.
   *
   * Yoco sends the HMAC-SHA256 digest of the raw request body in the
   * X-Yoco-Signature header, signed with YOCO_WEBHOOK_SECRET.
   *
   * Uses constant-time comparison to prevent timing-based attacks.
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.YOCO_WEBHOOK_SECRET ?? '';
    if (!secret) {
      console.warn('[Yoco] YOCO_WEBHOOK_SECRET is not set — rejecting webhook');
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      // Buffers of different length throw — means signature is wrong
      return false;
    }
  }
}
