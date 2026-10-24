/**
 * Praxis AI - Payment Provider Abstraction & RBI Recurring Mandate Engine
 * 
 * Supports:
 * 1. Domestic India Subscriptions via Razorpay (UPI Autopay, cards, e-NACH).
 * 2. Cross-border International Billing via Stripe (USD cards).
 * 3. Reserve Bank of India (RBI) Recurring Payment Circular compliance:
 *    - E-mandate limit: Transaction threshold of ₹15,000. Transactions above ₹15,000 require
 *      mandatory Additional Factor of Authentication (AFA / OTP).
 *    - Pre-debit notification: Minimum 24 hours prior notice required before debiting account.
 *    - Dunning / Retry schedule: Maximum 3 retries over 7 calendar days before moving to past_due / canceled.
 *    - Mandate cancellation: Facility for immediate customer-initiated mandate cancellation.
 * 
 * Tag: REQUIRES LAWYER REVIEW • REQUIRES CA REVIEW
 */

import { PlanTier } from '@/lib/stripe/plans';

export interface CreateSubscriptionParams {
  orgId: string;
  tier: PlanTier;
  seats: number;
  billingCycle: 'monthly' | 'annual';
  customerEmail: string;
  customerPhone?: string;
  customerGstin?: string;
  customerStateCode?: string;
  currency: 'INR' | 'USD';
}

export interface SubscriptionResult {
  provider: 'razorpay' | 'stripe';
  subscriptionId: string;
  customerId?: string;
  checkoutUrl?: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'active' | 'created' | 'authenticated' | 'past_due' | 'halted' | 'cancelled';
  requiresAfaOtp: boolean; // True if amount > ₹15,000 (RBI threshold)
  preDebitNoticeHours: number; // 24 hours per RBI mandate
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId?: string;
  eventType?: string;
  orgId?: string;
  subscriptionId?: string;
  tier?: PlanTier;
  seats?: number;
  status?: string;
  error?: string;
}

export interface PaymentProvider {
  getProviderName(): 'razorpay' | 'stripe';
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): WebhookVerificationResult;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}

// RBI Circular on Processing of e-Mandates on cards / UPI for recurring transactions
export const RBI_MANDATE_RULES = {
  AFA_THRESHOLD_INR: 15000, // ₹15,000 limit for auto-debit without per-transaction OTP
  PRE_DEBIT_NOTIFICATION_HOURS: 24, // Notification to cardholder at least 24 hours prior to actual charge
  MAX_RETRY_ATTEMPTS: 3, // Maximum automated retries
  DUNNING_GRACE_PERIOD_DAYS: 7, // 7 days grace period before entitlement revocation
  MANDATE_CANCELLATION_REQUIRED: true, // Facility for customer to cancel e-mandate anytime
};

/**
 * Checks whether an amount in INR exceeds the RBI e-mandate AFA threshold.
 */
export function requiresRbiAfaOtp(amountInr: number): boolean {
  return amountInr > RBI_MANDATE_RULES.AFA_THRESHOLD_INR;
}

/**
 * Generates pre-debit notification notice (§ RBI E-Mandate Circular).
 */
export function generatePreDebitNotification(params: {
  orgName: string;
  amountInr: number;
  scheduledDebitDate: Date;
  last4CardOrVpa: string;
}): { smsText: string; emailSubject: string; emailBody: string } {
  const formattedAmount = `₹${params.amountInr.toLocaleString('en-IN')}`;
  const formattedDate = params.scheduledDebitDate.toLocaleDateString('en-IN');

  const smsText = `Praxis AI: Your subscription renewal of ${formattedAmount} for ${params.orgName} will be debited from ${params.last4CardOrVpa} on ${formattedDate}. To modify, visit your billing dashboard.`;

  const emailSubject = `Pre-Debit Notification: Upcoming Subscription Renewal of ${formattedAmount}`;
  const emailBody = `Dear Customer, In accordance with RBI guidelines, this is a pre-debit notification that your recurring subscription of ${formattedAmount} will be processed on ${formattedDate} via mandate linked to ${params.last4CardOrVpa}.`;

  return { smsText, emailSubject, emailBody };
}
