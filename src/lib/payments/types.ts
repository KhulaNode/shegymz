/**
 * Payment Provider — Type Definitions
 *
 * All payments go through Yoco Online Payments (https://developer.yoco.com).
 * Payment records are persisted to PAYMENTS_DATA_DIR/payments.json
 * (atomic file writes; mount a Docker volume in production).
 */

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type PaymentProviderName = 'yoco';

export interface Plan {
  id: string;
  name: string;
  description: string;
  /** Amount in cents (ZAR). E.g. R399 → 39900 */
  amountCents: number;
  currency: 'ZAR';
  interval: 'monthly';
}

export interface PaymentRecord {
  id: string;
  /** Member's email address — used as user identifier (no auth system yet) */
  userId: string;
  planId: string;
  provider: PaymentProviderName;
  /** Provider-assigned ID: Yoco checkout ID */
  providerReference: string;
  /** Amount in cents */
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string; // ISO-8601
  paidAt?: string;   // ISO-8601
  metadata: {
    name: string;
    email: string;
    phone: string;
    bodyGoals?: string;
    referralName?: string;
    [key: string]: unknown;
  };
}

export interface CreateCheckoutInput {
  planId: string;
  /** Email used as userId */
  userId: string;
  /**
   * Internal payment record ID — embedded in provider metadata so that
   * webhooks can link provider events back to our payment record without
   * needing a separate lookup table.
   */
  paymentRecordId: string;
  metadata: {
    name: string;
    email: string;
    phone: string;
    bodyGoals?: string;
    referralName?: string;
  };
}

export interface CreateCheckoutOutput {
  success: boolean;
  /** URL to redirect the user to for payment */
  checkoutUrl?: string;
  /** Provider-assigned ID/reference for this checkout */
  providerReference?: string;
  error?: string;
}

export interface VerifyPaymentOutput {
  success: boolean;
  status?: PaymentStatus;
  paidAt?: string;
  error?: string;
}

/** Contract every payment provider must fulfil */
export interface IPaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput>;
  verifyPayment(providerReference: string): Promise<VerifyPaymentOutput>;
}
