import type { IPaymentProvider } from './types';
import { PaystackProvider } from './paystack-provider';

// Re-export everything consumers need
export type {
  IPaymentProvider,
  PaymentRecord,
  PaymentStatus,
  PaymentProviderName,
  Plan,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  VerifyPaymentOutput,
} from './types';

export { paymentStore } from './payment-store';
export { getPlan, PLANS, DEFAULT_PLAN_ID } from './plans';

export function getPaymentProvider(): IPaymentProvider {
  return new PaystackProvider();
}

export { PaystackProvider } from './paystack-provider';
