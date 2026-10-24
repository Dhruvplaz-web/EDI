import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as webhookPOST, processedWebhookEventIds } from '@/app/api/stripe/webhook/route';
import { POST as checkoutPOST } from '@/app/api/stripe/checkout/route';
import { stripe } from '@/lib/stripe/client';
import { createSignedSessionToken } from '@/lib/auth/session';

let currentMockCookies: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = currentMockCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
    set: vi.fn(),
  }),
}));

describe('Stripe Production Safety & Webhook Idempotency', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    processedWebhookEventIds.clear();
    currentMockCookies = {};
  });

  describe('Webhook Replay & Idempotency', () => {
    it('detects replayed webhook event and returns idempotentReplay: true without duplicate side effects', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests';

      const mockEvent = {
        id: 'evt_test_idempotency_98765',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              orgId: 'org_clinic_a',
              tier: 'professional',
              seats: '5',
            },
          },
        },
      };

      // Mock stripe.webhooks.constructEvent
      vi.spyOn(stripe.webhooks, 'constructEvent').mockReturnValue(mockEvent as unknown as Stripe.Event);

      const makeReq = () =>
        new NextRequest('https://praxis-ai.health/api/stripe/webhook', {
          method: 'POST',
          headers: {
            'stripe-signature': 't=123,v1=valid_mock_signature',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockEvent),
        });

      // 1. Initial Webhook Dispatch
      const firstRes = await webhookPOST(makeReq());
      expect(firstRes.status).toBe(200);
      const firstData = await firstRes.json();
      expect(firstData.received).toBe(true);
      expect(firstData.idempotentReplay).toBeUndefined();
      expect(firstData.eventId).toBe('evt_test_idempotency_98765');

      // 2. Replay of Identical Event (Network retry or Stripe redelivery)
      const replayRes = await webhookPOST(makeReq());
      expect(replayRes.status).toBe(200);
      const replayData = await replayRes.json();
      expect(replayData.received).toBe(true);
      expect(replayData.idempotentReplay).toBe(true);
      expect(replayData.eventId).toBe('evt_test_idempotency_98765');
    });
  });

  describe('Production Mock Mode Ban', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    });

    it('prohibits mock sandbox mode when NODE_ENV is production and keys are missing/placeholder', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.STRIPE_SECRET_KEY;

      const adminToken = await createSignedSessionToken({
        uid: 'billing_admin_1',
        role: 'billing_admin',
        orgId: 'org_enterprise_clinic',
      });

      currentMockCookies = {
        session: adminToken,
      };

      const req = new NextRequest('https://praxis-ai.health/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'professional',
          seats: 5,
          billingCycle: 'monthly',
          orgId: 'org_enterprise_clinic',
        }),
      });

      const res = await checkoutPOST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Mock mode is forbidden in production');
    });
  });
});
