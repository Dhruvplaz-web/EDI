import { describe, it, expect } from 'vitest';
import { 
  SAAS_PLANS, 
  calculateSubscriptionCost, 
  hasFeatureEntitlement, 
  PlanTier 
} from '@/lib/stripe/plans';

describe('SaaS Billing Engine & Tier Entitlement Gating', () => {
  it('defines 3 distinct clinical subscription tiers with per-seat pricing', () => {
    const tiers: PlanTier[] = ['starter', 'professional', 'enterprise'];
    for (const tier of tiers) {
      const plan = SAAS_PLANS[tier];
      expect(plan).toBeDefined();
      expect(plan.pricePerSeatMonthly).toBeGreaterThan(0);
      expect(plan.pricePerSeatAnnual).toBeLessThan(plan.pricePerSeatMonthly); // 20% annual discount
      expect(plan.trialDays).toBeGreaterThanOrEqual(14);
    }
  });

  it('calculates monthly billing cost correctly for multiple seats', () => {
    // Starter: $199 monthly, $159 annual
    expect(calculateSubscriptionCost('starter', 1, 'monthly')).toBe(199);
    expect(calculateSubscriptionCost('starter', 3, 'monthly')).toBe(597);
    expect(calculateSubscriptionCost('starter', 3, 'annual')).toBe(477);

    // Professional: $399 monthly, $319 annual
    expect(calculateSubscriptionCost('professional', 8, 'annual')).toBe(2552);
  });

  it('enforces feature gating: Solo Practice does NOT have Multimodal Attention or Dedicated BAA', () => {
    expect(hasFeatureEntitlement('starter', 'crossAttentionMultimodalFusion')).toBe(false);
    expect(hasFeatureEntitlement('starter', 'hipaaBaaDedicated')).toBe(false);
    expect(hasFeatureEntitlement('starter', 'ehrFhirExport')).toBe(false);
  });

  it('enforces feature gating: Clinical Group Practice includes Multimodal Fusion and Standard BAA', () => {
    expect(hasFeatureEntitlement('professional', 'crossAttentionMultimodalFusion')).toBe(true);
    expect(hasFeatureEntitlement('professional', 'hipaaBaaDedicated')).toBe(true);
    expect(hasFeatureEntitlement('professional', 'ehrFhirExport')).toBe(false); // Only Enterprise
  });

  it('enforces feature gating: Enterprise Health System unlocks FHIR EHR integration', () => {
    expect(hasFeatureEntitlement('enterprise', 'ehrFhirExport')).toBe(true);
    expect(hasFeatureEntitlement('enterprise', 'crossAttentionMultimodalFusion')).toBe(true);
  });
});
