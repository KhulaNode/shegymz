import type { Plan } from './types';

/**
 * Plan catalogue.
 *
 * Prices are read exclusively from environment variables — never hardcoded here.
 * NEXT_PUBLIC_SUBSCRIPTION_AMOUNT is the single source of truth for the monthly price.
 *
 * Add more plans (e.g., quarterly, annual) by extending this map.
 */
export const PLANS: Record<string, Plan> = {
  monthly: {
    id: 'monthly',
    name: 'SheGymZ Monthly Membership',
    description:
      "Private women's wellness club — 24/7 access, personal trainers included",
    // Multiply by 100 to convert ZAR → cents
    amountCents: Math.round(
      parseFloat(process.env.NEXT_PUBLIC_SUBSCRIPTION_AMOUNT ?? '399') * 100,
    ),
    currency: 'ZAR',
    interval: 'monthly',
  },
};

export function getPlan(planId: string): Plan | undefined {
  return PLANS[planId];
}

export const DEFAULT_PLAN_ID = 'monthly';
