import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { RazorpayPaymentProvider, DUNNING_NOTICES } from '@/lib/payments/razorpay';
import {
  calculateGst,
  validateGstin,
  generateTaxInvoice,
  resetInvoiceCounterForTesting,
  SAC_CODE,
} from '@/lib/payments/gst';
import {
  requiresRbiAfaOtp,
  generatePreDebitNotification,
  RBI_MANDATE_RULES,
} from '@/lib/payments/provider';
import { hasFeatureEntitlement, OrgSubscriptionInfo } from '@/lib/stripe/plans';
import { AtomicWebhookClaimStore } from '@/lib/stripe/idempotency';

describe('Part 5: India Payments, RBI Mandates & GST Invoicing Suite', () => {
  const razorpayProvider = new RazorpayPaymentProvider();
  const testWebhookSecret = 'rzp_sec_test_hmac_secret_9988';

  beforeEach(() => {
    AtomicWebhookClaimStore.clearForTesting();
    resetInvoiceCounterForTesting();
  });

  // --------------------------------------------------------------------------
  // 1. Razorpay Webhook Signature Verification & Idempotency
  // --------------------------------------------------------------------------
  describe('1. Razorpay Webhook Signature Verification & Atomic Idempotency', () => {
    function generateValidRazorpaySignature(rawBody: string, secret: string): string {
      return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    }

    it('verifies valid HMAC-SHA256 signature and extracts subscription metadata', () => {
      const payload = {
        event_id: 'rzp_evt_sub_charged_01',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_99001',
              status: 'active',
              notes: {
                orgId: 'org_delhi_neuro_01',
                tier: 'professional',
                seats: '5',
              },
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const validSig = generateValidRazorpaySignature(rawBody, testWebhookSecret);

      const result = razorpayProvider.verifyWebhookSignature(rawBody, validSig, testWebhookSecret);
      expect(result.isValid).toBe(true);
      expect(result.eventId).toBe('rzp_evt_sub_charged_01');
      expect(result.eventType).toBe('subscription.charged');
      expect(result.orgId).toBe('org_delhi_neuro_01');
      expect(result.tier).toBe('professional');
      expect(result.seats).toBe(5);
    });

    it('rejects tampered or forged webhook signatures', () => {
      const rawBody = JSON.stringify({ event: 'subscription.charged' });
      const forgedSig = 'forged_invalid_hmac_hex_signature_abcdef';

      const result = razorpayProvider.verifyWebhookSignature(rawBody, forgedSig, testWebhookSecret);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('failed');
    });

    it('enforces atomic deduplication: duplicate webhook replay is safely skipped', async () => {
      const eventId = 'rzp_evt_duplicate_delivery_42';

      // First delivery claims the lock
      const claim1 = await AtomicWebhookClaimStore.claim(eventId, 60000);
      expect(claim1.claimed).toBe(true);
      expect(claim1.status).toBe('processing');

      // Complete the first delivery
      await AtomicWebhookClaimStore.complete(eventId);

      // Duplicate delivery attempt is rejected
      const claim2 = await AtomicWebhookClaimStore.claim(eventId, 60000);
      expect(claim2.claimed).toBe(false);
      expect(claim2.status).toBe('done');
      expect(claim2.reason).toContain('already completed');
    });

    it('blocks concurrent duplicate delivery while worker lease is active', async () => {
      const eventId = 'rzp_evt_concurrent_race_99';

      // Worker A claims event with 60s lease
      const claimA = await AtomicWebhookClaimStore.claim(eventId, 60000);
      expect(claimA.claimed).toBe(true);

      // Concurrent Worker B attempts to claim the same event while Worker A is processing
      const claimB = await AtomicWebhookClaimStore.claim(eventId, 60000);
      expect(claimB.claimed).toBe(false);
      expect(claimB.status).toBe('processing');
      expect(claimB.reason?.toLowerCase()).toContain('processing');
    });
  });

  // --------------------------------------------------------------------------
  // 2. RBI Recurring Payment Rules & Pre-Debit Notifications
  // --------------------------------------------------------------------------
  describe('2. RBI Recurring Mandate Rules & AFA Thresholds', () => {
    it('enforces ₹15,000 threshold for Additional Factor of Authentication (AFA/OTP)', () => {
      // Below threshold: auto-debit allowed without per-transaction OTP
      expect(requiresRbiAfaOtp(4999)).toBe(false);
      expect(requiresRbiAfaOtp(15000)).toBe(false); // Exactly at limit

      // Above threshold: mandatory AFA / OTP required under RBI Circular
      expect(requiresRbiAfaOtp(15001)).toBe(true);
      expect(requiresRbiAfaOtp(35000)).toBe(true);
    });

    it('generates mandatory 24-hour pre-debit notifications', () => {
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = generatePreDebitNotification({
        orgName: 'MindCare Psychiatric Clinic',
        amountInr: 12500,
        scheduledDebitDate: scheduledDate,
        last4CardOrVpa: 'UPI Autopay mindcare@okhdfcbank',
      });

      expect(notification.smsText).toContain('Praxis AI:');
      expect(notification.smsText).toContain('₹12,500');
      expect(notification.smsText).toContain('UPI Autopay');
      expect(notification.emailSubject).toContain('Pre-Debit Notification');
      expect(notification.emailBody).toContain('In accordance with RBI guidelines');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Indian GST Calculation & Place of Supply
  // --------------------------------------------------------------------------
  describe('3. GST SAC 998313 Invoicing & Place of Supply', () => {
    it('validates 15-character Indian GSTIN formats', () => {
      // Valid Maharashtra GSTIN
      const validMh = validateGstin('27ABCDE1234F1Z5');
      expect(validMh.isValid).toBe(true);
      expect(validMh.stateCode).toBe('27');

      // Valid Delhi GSTIN
      const validDl = validateGstin('07ABCDE1234F1Z5');
      expect(validDl.isValid).toBe(true);
      expect(validDl.stateCode).toBe('07');

      // Malformed
      expect(validateGstin('invalid_gstin_code').isValid).toBe(false);
    });

    it('calculates Intra-State GST (CGST 9% + SGST 9%) for same-state supply (Maharashtra)', () => {
      const gst = calculateGst({
        amount: 10000,
        supplierStateCode: '27', // Maharashtra
        customerStateCode: '27', // Maharashtra
      });

      expect(gst.supplyType).toBe('INTRA_STATE');
      expect(gst.cgstRate).toBe(0.09);
      expect(gst.cgstAmount).toBe(900);
      expect(gst.sgstRate).toBe(0.09);
      expect(gst.sgstAmount).toBe(900);
      expect(gst.igstAmount).toBe(0);
      expect(gst.totalGst).toBe(1800);
      expect(gst.totalAmount).toBe(11800);
      expect(gst.sacCode).toBe(SAC_CODE);
    });

    it('calculates Inter-State GST (IGST 18%) for cross-state supply (Maharashtra to Delhi)', () => {
      const gst = calculateGst({
        amount: 10000,
        supplierStateCode: '27', // Maharashtra
        customerStateCode: '07', // Delhi
      });

      expect(gst.supplyType).toBe('INTER_STATE');
      expect(gst.cgstAmount).toBe(0);
      expect(gst.sgstAmount).toBe(0);
      expect(gst.igstRate).toBe(0.18);
      expect(gst.igstAmount).toBe(1800);
      expect(gst.totalGst).toBe(1800);
      expect(gst.totalAmount).toBe(11800);
    });

    it('handles International Export of Services with Zero-Rated GST under LUT', () => {
      const gst = calculateGst({
        amount: 500,
        isInternational: true,
      });

      expect(gst.supplyType).toBe('EXPORT_ZERO_RATED');
      expect(gst.totalGst).toBe(0);
      expect(gst.totalAmount).toBe(500);
    });

    it('generates sequential Tax Invoice with e-Invoicing notice', () => {
      const invoice = generateTaxInvoice({
        orgId: 'org_delhi_mind',
        orgName: 'Delhi Mind Clinic',
        recipientGstin: '07ABCDE1234F1Z5',
        customerStateCode: '07',
        seats: 5,
        tierName: 'Clinical Group Practice',
        billingCycle: 'annual',
        subtotalInr: 50000,
      });

      expect(invoice.invoiceNumber).toMatch(/^INV-\d{2}-\d{2}-\d{4}$/);
      expect(invoice.gst.supplyType).toBe('INTER_STATE');
      expect(invoice.gst.igstAmount).toBe(9000);
      expect(invoice.eInvoicingNotice).toContain('VERIFY WITH CA');
      expect(invoice.statutoryTag).toContain('SECTION 31 OF THE CGST ACT 2017');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Entitlement Lockout on Payment Failure & Dunning
  // --------------------------------------------------------------------------
  describe('4. Subscription Lifecycle & Entitlement Lockout', () => {
    it('maintains feature entitlement during 7-day grace period for past_due subscriptions', () => {
      const now = Date.now();
      const pastDueRecent: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'past_due',
        currentSeats: 3,
        pastDueSince: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago (< 7 days)
      };

      // Entitlement active during grace period
      expect(hasFeatureEntitlement(pastDueRecent, 'crossAttentionMultimodalFusion')).toBe(true);
    });

    it('locks out entitlements once past_due exceeds the 7-day grace period', () => {
      const now = Date.now();
      const pastDueExpired: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'past_due',
        currentSeats: 3,
        pastDueSince: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago (> 7 days)
      };

      // Entitlement locked out
      expect(hasFeatureEntitlement(pastDueExpired, 'crossAttentionMultimodalFusion')).toBe(false);
    });

    it('immediately revokes entitlements for canceled or unpaid subscriptions', () => {
      const canceledSub: OrgSubscriptionInfo = {
        tier: 'enterprise',
        status: 'canceled',
        currentSeats: 10,
      };
      expect(hasFeatureEntitlement(canceledSub, 'crossAttentionMultimodalFusion')).toBe(false);

      const unpaidSub: OrgSubscriptionInfo = {
        tier: 'enterprise',
        status: 'unpaid',
        currentSeats: 10,
      };
      expect(hasFeatureEntitlement(unpaidSub, 'crossAttentionMultimodalFusion')).toBe(false);
    });

    it('provides trilingual dunning notices for payment failure', () => {
      for (const lang of ['en', 'hi', 'mr'] as const) {
        const dunning = DUNNING_NOTICES[lang];
        expect(dunning).toBeDefined();
        const msg = dunning.body('Apex Clinic', 4);
        expect(msg).toContain('Apex Clinic');
        expect(msg).toContain('4');
      }
    });
  });
});
