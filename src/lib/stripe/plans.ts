/**
 * Praxis AI / EDI - B2B SaaS Subscription Plans & Feature Gating (India Localization)
 * Per-clinician seat pricing model with 14-day trial and tiered capability bounds.
 *
 * Tax & Regulatory Grounding:
 * - GST SAC Code 998313 (Information Technology software services @ 18% GST)
 * - Digital Personal Data Protection Act 2023 (Data Processing Agreement / Section 8)
 * - Telemedicine Practice Guidelines 2020 (3-year audit & record retention)
 * - RBI e-Mandate circulars for recurring subscriptions
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
  pricePerSeatMonthly: number; // in USD (International)
  pricePerSeatAnnual: number;  // in USD (International discounted)
  priceInrMonthlyPlaceholder: string; // "to be decided"
  priceInrAnnualPlaceholder: string;  // "to be decided"
  gstRate: number; // 0.18 (18% GST under SAC 998313)
  sacCode: string; // "998313"
  maxSeats: number;
  trialDays: number;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  razorpayPlanIdMonthly?: string;
  razorpayPlanIdAnnual?: string;
  features: PlanFeature[];
  entitlements: {
    maxMonthlyConsultationsPerSeat: number;
    telemetryHistoryDays: number;
    crossAttentionMultimodalFusion: boolean;
    customSoapTemplates: boolean;
    liveEmergencyDispatchIntegration: boolean;
    dpdpDpaDedicated: boolean;
    hipaaBaaDedicated: boolean; // Backwards-compatibility alias
    ehrFhirExport: boolean;
    dedicatedSupportSlaHours: number;
  };
}

export const SAAS_PLANS: Record<PlanTier, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Solo & Private Practice',
    tagline: 'Core tele-psychiatry and edge objective bio-acoustic screening for independent clinicians in India.',
    pricePerSeatMonthly: 199,
    pricePerSeatAnnual: 159,
    priceInrMonthlyPlaceholder: 'To be decided',
    priceInrAnnualPlaceholder: 'To be decided',
    gstRate: 0.18,
    sacCode: '998313',
    maxSeats: 3,
    trialDays: 14,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual_test',
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY || 'plan_starter_monthly_test',
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_STARTER_ANNUAL || 'plan_starter_annual_test',
    features: [
      { name: 'Up to 3 Clinician Seats', included: true },
      { name: 'WebRTC HD Video Consultation Rooms (India Region)', included: true },
      { name: 'Telemedicine Practice Guidelines 2020 Intake & Records', included: true },
      { name: 'E-Prescriptions with Schedule X & NDPS Restrictions', included: true },
      { name: 'Standard Clinical SOAP Documentation', included: true },
      { name: '3-Year Mandatory Telemedicine Audit Retention', included: true },
      { name: 'Research Mode Bio-Acoustic Jitter (IEC Required) [Coming soon]', included: false },
      { name: 'ABDM / ABHA Sandbox Integration [Coming soon]', included: false },
      { name: 'Dedicated DPDP Data Processing Agreement (DPA)', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 150,
      telemetryHistoryDays: 30, // Transient sensor telemetry retention (Medical records kept min 3 years)
      crossAttentionMultimodalFusion: false,
      customSoapTemplates: false,
      liveEmergencyDispatchIntegration: false,
      dpdpDpaDedicated: false,
      hipaaBaaDedicated: false,
      ehrFhirExport: false,
      dedicatedSupportSlaHours: 48,
    }
  },
  professional: {
    id: 'professional',
    name: 'Clinical Group Practice',
    badge: 'MOST POPULAR',
    tagline: 'Group telepsychiatry, emergency clinical escalation, and team triage for Indian psychiatric clinics.',
    pricePerSeatMonthly: 399,
    pricePerSeatAnnual: 319,
    priceInrMonthlyPlaceholder: 'To be decided',
    priceInrAnnualPlaceholder: 'To be decided',
    gstRate: 0.18,
    sacCode: '998313',
    maxSeats: 25,
    trialDays: 14,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual_test',
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY || 'plan_pro_monthly_test',
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_PRO_ANNUAL || 'plan_pro_annual_test',
    features: [
      { name: 'Up to 25 Clinician Seats', included: true },
      { name: 'Everything in Solo Practice', included: true },
      { name: 'Clinic Manager & Nurse Role-Based Access Controls', included: true },
      { name: 'Tele-MANAS & National Emergency 112 Protocol Integration', included: true },
      { name: 'Multi-Lingual Patient Intake (English, Hindi, Marathi)', included: true },
      { name: 'Research Mode AI Multimodal Screening (IEC Required) [Coming soon]', included: false },
      { name: 'Standard DPDP Data Processing Agreement (DPA) [Coming soon]', included: false },
      { name: 'Ayushman Bharat Digital Mission (ABDM M1/M2) [Coming soon]', included: false },
      { name: 'Custom Hospital SSO / SAML [Coming soon]', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 500,
      telemetryHistoryDays: 365,
      crossAttentionMultimodalFusion: true,
      customSoapTemplates: false,
      liveEmergencyDispatchIntegration: true,
      dpdpDpaDedicated: false,
      hipaaBaaDedicated: false,
      ehrFhirExport: false,
      dedicatedSupportSlaHours: 12,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Health System & Hospital',
    badge: 'ENTERPRISE',
    tagline: 'Custom hospital network deployment, dedicated cloud isolation in Mumbai/Delhi, and enterprise SLAs.',
    pricePerSeatMonthly: 799,
    pricePerSeatAnnual: 649,
    priceInrMonthlyPlaceholder: 'To be decided',
    priceInrAnnualPlaceholder: 'To be decided',
    gstRate: 0.18,
    sacCode: '998313',
    maxSeats: 9999,
    trialDays: 30,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_test',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual_test',
    razorpayPlanIdMonthly: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || 'plan_enterprise_monthly_test',
    razorpayPlanIdAnnual: process.env.RAZORPAY_PLAN_ENTERPRISE_ANNUAL || 'plan_enterprise_annual_test',
    features: [
      { name: 'Unlimited Clinician Seats', included: true },
      { name: 'Everything in Clinical Group Practice', included: true },
      { name: 'Dedicated India Cloud Isolation (asia-south1 / asia-south2)', included: true },
      { name: 'Multi-Tenant Clinical Operations Isolation', included: true },
      { name: 'Dedicated Institutional Ethics Committee Research Mode Protocol', included: true },
      { name: 'Custom DPDP Data Processing Agreement (DPA) with Clinic Indemnity', included: true },
      { name: '24/7/365 Dedicated Systems Engineer SLA [Coming soon]', included: false },
      { name: 'Ayushman Bharat Digital Mission (ABDM M1/M2/M3) [Coming soon]', included: false },
    ],
    entitlements: {
      maxMonthlyConsultationsPerSeat: 99999,
      telemetryHistoryDays: 2555,
      crossAttentionMultimodalFusion: true,
      customSoapTemplates: false,
      liveEmergencyDispatchIntegration: true,
      dpdpDpaDedicated: true,
      hipaaBaaDedicated: true, // Alias
      ehrFhirExport: false,
      dedicatedSupportSlaHours: 1,
    }
  }
};

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'none';

export interface OrgSubscriptionInfo {
  tier?: PlanTier;
  status: SubscriptionStatus;
  currentSeats: number;
  maxSeats: number;
  trialEndsAt?: number;
  pastDueSince?: number;
  currency?: 'INR' | 'USD';
  gstin?: string;
  stateCode?: string;
}

/**
 * Checks if a given organization has entitlement to a specific feature.
 * Enforces subscription status (active/trialing OK; past_due 7-day grace period; canceled/unpaid/none locked),
 * verifies seat count, and rejects missing tiers with zero default fallback.
 */
export function hasFeatureEntitlement(
  subscriptionOrTier: OrgSubscriptionInfo | PlanTier,
  feature: keyof typeof SAAS_PLANS['starter']['entitlements']
): boolean {
  // If string passed directly, evaluate tier default capabilities
  if (typeof subscriptionOrTier === 'string') {
    const plan = SAAS_PLANS[subscriptionOrTier];
    if (!plan) return false;
    if (feature === 'hipaaBaaDedicated') {
      return Boolean(plan.entitlements.dpdpDpaDedicated || plan.entitlements.hipaaBaaDedicated);
    }
    return Boolean(plan.entitlements[feature]);
  }

  const sub = subscriptionOrTier;
  if (!sub || !sub.tier) return false;

  const plan = SAAS_PLANS[sub.tier];
  if (!plan) return false;

  // Enforce seat limit check
  if (sub.currentSeats > plan.maxSeats) {
    return false;
  }

  // Enforce subscription lifecycle state
  const status = sub.status;
  if (status === 'canceled' || status === 'unpaid' || status === 'none' || status === 'incomplete') {
    return false;
  }

  // Grace period for past_due: 7 days
  if (status === 'past_due') {
    if (!sub.pastDueSince) return false;
    const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sub.pastDueSince > gracePeriodMs) {
      return false;
    }
  }

  // Trial expiration check
  if (status === 'trialing') {
    if (sub.trialEndsAt && Date.now() > sub.trialEndsAt) {
      return false;
    }
  }

  if (feature === 'hipaaBaaDedicated') {
    return Boolean(plan.entitlements.dpdpDpaDedicated || plan.entitlements.hipaaBaaDedicated);
  }
  return Boolean(plan.entitlements[feature]);
}

export function getFeatureLimit(
  subscriptionOrTier: OrgSubscriptionInfo | PlanTier,
  feature: 'maxMonthlyConsultationsPerSeat' | 'telemetryHistoryDays' | 'dedicatedSupportSlaHours'
): number {
  const tier = typeof subscriptionOrTier === 'string' ? subscriptionOrTier : subscriptionOrTier.tier;
  if (!tier || !SAAS_PLANS[tier]) return 0;
  return SAAS_PLANS[tier].entitlements[feature];
}

export function calculateSubscriptionCost(
  tier: PlanTier,
  seats: number,
  billingCycle: 'monthly' | 'annual'
): number {
  const plan = SAAS_PLANS[tier];
  if (!plan) return 0;
  const unitPrice = billingCycle === 'annual' ? plan.pricePerSeatAnnual : plan.pricePerSeatMonthly;
  return unitPrice * seats;
}

export interface IndianSubscriptionQuote {
  subtotal: number;
  gstAmount: number;
  total: number;
  isPlaceholder: boolean;
  currency: 'INR';
  sacCode: string;
  gstRate: number;
  formattedDisplay: string;
}

export function calculateIndianSubscriptionQuote(
  tier: PlanTier,
  seats: number,
  billingCycle: 'monthly' | 'annual'
): IndianSubscriptionQuote {
  const plan = SAAS_PLANS[tier] || SAAS_PLANS.starter;
  return {
    subtotal: 0,
    gstAmount: 0,
    total: 0,
    isPlaceholder: true,
    currency: 'INR',
    sacCode: plan.sacCode || '998313',
    gstRate: plan.gstRate || 0.18,
    formattedDisplay: '₹ [To be decided] + 18% GST',
  };
}
