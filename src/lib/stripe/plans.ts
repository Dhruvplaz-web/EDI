/**
 * Praxis AI / EDI - B2B SaaS Subscription Plans & Feature Gating
 * Per-clinician seat pricing model with 14-day trial and tiered capability bounds.
 */

export type PlanTier = 'starter' | 'professional' | 'enterprise';

export interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingPlan {
  id: PlanTier;
  name: string;
  badge?: string;
  tagline: string;
  pricePerSeatMonthly: number; // in USD
  pricePerSeatAnnual: number;  // in USD (discounted)
  maxSeats: number;
  trialDays: number;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  features: PlanFeature[];
  entitlements: {
    maxMonthlyConsultationsPerSeat: number;
    telemetryHistoryDays: number;
    crossAttentionMultimodalFusion: boolean;
    customSoapTemplates: boolean;
    liveEmergencyDispatchIntegration: boolean;
    hipaaBaaDedicated: boolean;
    ehrFhirExport: boolean;
    dedicatedSupportSlaHours: number;
  };
}

export const SAAS_PLANS: Record<PlanTier, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Solo & Private Practice',
    tagline: 'Core tele-psychiatry and edge objective bio-acoustic screening for independent clinicians.',
    pricePerSeatMonthly: 199,
    pricePerSeatAnnual: 159,
    maxSeats: 3,
    trialDays: 14,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual_test',
    features: [
      { name: 'Up to 3 Clinician Seats', included: true },
      { name: 'WebRTC HD Video Consultation Rooms', included: true },
      { name: 'Edge YIN Acoustic Pitch & Jitter Extraction', included: true },
      { name: 'Corrugator (AU4) & Depressor (AU15) Face Mesh', included: true },
      { name: 'Standard Automated SOAP Note Generation', included: true },
      { name: '30-Day Clinical Telemetry Retention', included: true },
      { name: 'Cross-Attention Multimodal Fusion Matrix', included: false },
      { name: 'Automated EHR / FHIR Integration', included: false },
      { name: 'Dedicated HIPAA Business Associate Agreement (BAA)', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 150,
      telemetryHistoryDays: 30,
      crossAttentionMultimodalFusion: false,
      customSoapTemplates: false,
      liveEmergencyDispatchIntegration: false,
      hipaaBaaDedicated: false,
      ehrFhirExport: false,
      dedicatedSupportSlaHours: 48,
    }
  },
  professional: {
    id: 'professional',
    name: 'Clinical Group Practice',
    badge: 'MOST POPULAR',
    tagline: 'Comprehensive multimodal AI screening, discrepancy index scoring, and team triage.',
    pricePerSeatMonthly: 399,
    pricePerSeatAnnual: 319,
    maxSeats: 25,
    trialDays: 14,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual_test',
    features: [
      { name: 'Up to 25 Clinician Seats', included: true },
      { name: 'Everything in Solo Practice', included: true },
      { name: 'Cross-Modal Attention Fusion (Acoustic + Facial + Linguistic)', included: true },
      { name: 'Automated Discrepancy Index D(t) Tracking', included: true },
      { name: 'Customizable EHR SOAP Note Templates', included: true },
      { name: '1-Year Clinical Telemetry History & Trends', included: true },
      { name: 'Standard HIPAA Business Associate Agreement (BAA)', included: true },
      { name: 'Automated EHR / FHIR Integration', included: false },
      { name: 'Custom SSO / SAML Authentication', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 500,
      telemetryHistoryDays: 365,
      crossAttentionMultimodalFusion: true,
      customSoapTemplates: true,
      liveEmergencyDispatchIntegration: true,
      hipaaBaaDedicated: true,
      ehrFhirExport: false,
      dedicatedSupportSlaHours: 12,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Health System & Hospital',
    badge: 'ENTERPRISE',
    tagline: 'Custom hospital network deployment, dedicated cloud isolation, and team management.',
    pricePerSeatMonthly: 799,
    pricePerSeatAnnual: 649,
    maxSeats: 9999,
    trialDays: 30,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual_test',
    features: [
      { name: 'Unlimited Clinician Seats', included: true },
      { name: 'Everything in Clinical Group Practice', included: true },
      { name: 'Multi-Tenant Clinical Operations Isolation', included: true },
      { name: 'Multi-Year Audit Trail & Telemetry Archive', included: true },
      { name: '24/7/365 Dedicated Systems Engineer SLA', included: true },
      { name: 'Epic / Cerner HL7 & FHIR Bidirectional Sync [Coming Soon]', included: false },
      { name: 'SAML 2.0 / Okta / Azure AD SSO [Coming Soon]', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 99999,
      telemetryHistoryDays: 2555, // 7 years HIPAA data retention
      crossAttentionMultimodalFusion: true,
      customSoapTemplates: false, // In development
      liveEmergencyDispatchIntegration: true,
      hipaaBaaDedicated: true,
      ehrFhirExport: false, // Coming soon
      dedicatedSupportSlaHours: 1,
    }
  }
};

/**
 * Checks if a given organization plan has entitlement to a specific feature
 */
export function hasFeatureEntitlement(
  tier: PlanTier | undefined,
  feature: keyof typeof SAAS_PLANS['starter']['entitlements']
): boolean {
  if (!tier || !SAAS_PLANS[tier]) {
    return false;
  }
  const plan = SAAS_PLANS[tier];
  const value = plan.entitlements[feature];
  return Boolean(value);
}

/**
 * Calculates monthly billing invoice amount for a clinic
 */
export function calculateSubscriptionCost(
  tier: PlanTier,
  seats: number,
  billingCycle: 'monthly' | 'annual'
): number {
  const plan = SAAS_PLANS[tier];
  const rate = billingCycle === 'annual' ? plan.pricePerSeatAnnual : plan.pricePerSeatMonthly;
  return rate * Math.max(1, seats);
}
