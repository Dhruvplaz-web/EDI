import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasFeatureEntitlement,
  OrgSubscriptionInfo,
  PlanTier
} from '@/lib/stripe/plans';
import {
  isEventProcessed,
  recordProcessedEvent,
  clearIdempotencyStoreForTesting
} from '@/lib/stripe/idempotency';

describe('D.1 & D.3: SaaS Subscription Entitlements & Webhook Idempotency Store', () => {
  beforeEach(() => {
    clearIdempotencyStoreForTesting();
  });

  describe('D.1: Entitlements Gate (Status & Seat Count)', () => {
    it('returns false when subscription status is canceled, unpaid, or none (locked)', () => {
      const canceledSub: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'canceled',
        currentSeats: 5,
        maxSeats: 25,
      };

      const unpaidSub: OrgSubscriptionInfo = {
        tier: 'enterprise',
        status: 'unpaid',
        currentSeats: 10,
        maxSeats: 100,
      };

      const noneSub: OrgSubscriptionInfo = {
        status: 'none',
        currentSeats: 1,
        maxSeats: 1,
      };

      expect(hasFeatureEntitlement(canceledSub, 'crossAttentionMultimodalFusion')).toBe(false);
      expect(hasFeatureEntitlement(unpaidSub, 'crossAttentionMultimodalFusion')).toBe(false);
      expect(hasFeatureEntitlement(noneSub, 'customSoapTemplates')).toBe(false);
    });

    it('returns false with no fallback to starter if tier is missing or unverified', () => {
      const invalidSub: OrgSubscriptionInfo = {
        status: 'active',
        currentSeats: 1,
        maxSeats: 3,
      };

      expect(hasFeatureEntitlement(invalidSub, 'crossAttentionMultimodalFusion')).toBe(false);
      expect(hasFeatureEntitlement(undefined, 'customSoapTemplates')).toBe(false);
    });

    it('allows access for active or trialing subscriptions within seat limits', () => {
      const activePro: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'active',
        currentSeats: 12,
        maxSeats: 25,
      };

      const trialingStarter: OrgSubscriptionInfo = {
        tier: 'starter',
        status: 'trialing',
        currentSeats: 2,
        maxSeats: 3,
      };

      expect(hasFeatureEntitlement(activePro, 'crossAttentionMultimodalFusion')).toBe(true);
      expect(hasFeatureEntitlement(trialingStarter, 'maxMonthlyConsultationsPerSeat')).toBe(true);
      // Feature not included in starter tier
      expect(hasFeatureEntitlement(trialingStarter, 'crossAttentionMultimodalFusion')).toBe(false);
    });

    it('allows past_due within 7-day grace period, but locks when grace period expires', () => {
      const now = Date.now();
      const pastDueWithinGrace: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'past_due',
        currentSeats: 5,
        maxSeats: 25,
        pastDueSince: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago (<7 days)
      };

      const pastDueExpired: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'past_due',
        currentSeats: 5,
        maxSeats: 25,
        pastDueSince: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago (>7 days)
      };

      expect(hasFeatureEntitlement(pastDueWithinGrace, 'crossAttentionMultimodalFusion')).toBe(true);
      expect(hasFeatureEntitlement(pastDueExpired, 'crossAttentionMultimodalFusion')).toBe(false);
    });

    it('locks entitlements when currentSeats exceeds maxSeats (seat limit enforcement)', () => {
      const overSeatSub: OrgSubscriptionInfo = {
        tier: 'professional',
        status: 'active',
        currentSeats: 28, // Exceeds maxSeats 25
        maxSeats: 25,
      };

      expect(hasFeatureEntitlement(overSeatSub, 'crossAttentionMultimodalFusion')).toBe(false);
    });
  });

  describe('D.3: Webhook Idempotency Store (Out of route.ts, durable storage)', () => {
    it('detects replayed events and rejects duplicates only after successful processing', async () => {
      const eventId = 'evt_test_replay_12345';

      expect(await isEventProcessed(eventId)).toBe(false);

      // Successfully process event and record it
      await recordProcessedEvent(eventId);

      expect(await isEventProcessed(eventId)).toBe(true);
    });

    it('does not mark event as processed if processing fails, allowing retry', async () => {
      const failedEventId = 'evt_test_failure_67890';

      // Simulation: Handler crashes during processing before recordProcessedEvent is called
      expect(await isEventProcessed(failedEventId)).toBe(false);

      // On retry, isEventProcessed remains false
      expect(await isEventProcessed(failedEventId)).toBe(false);

      // When retry succeeds, mark as processed
      await recordProcessedEvent(failedEventId);
      expect(await isEventProcessed(failedEventId)).toBe(true);
    });
  });
});
