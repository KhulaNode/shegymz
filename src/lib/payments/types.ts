/**
 * Payment Provider — Type Definitions
 */

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type PaymentProviderName = 'paystack';

export interface Plan {
  id: string;
  name: string;
  description: string;
  /** Amount in cents (ZAR). E.g. R399 → 39900 */
  amountCents: number;
  currency: 'ZAR';
  interval: 'monthly';
}

export interface CreateCheckoutInput {
  planId: string;
  userId: string;
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
  checkoutUrl?: string;
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
