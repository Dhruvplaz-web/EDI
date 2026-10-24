import { describe, it, expect, beforeEach } from 'vitest';
import { AtomicWebhookClaimStore } from '@/lib/stripe/idempotency';

describe('Part G.1: Atomic Webhook Claim Store & Concurrency Resilience', () => {
  beforeEach(() => {
    AtomicWebhookClaimStore.clearForTesting();
  });

  it('concurrency test: exactly ONE of 5 simultaneous webhook deliveries succeeds in claiming event', async () => {
    const eventId = `evt_concurrent_${Date.now()}`;

    // Dispatch 5 simultaneous atomic claims
    const claimAttempts = await Promise.all([
      AtomicWebhookClaimStore.claim(eventId, 30000),
      AtomicWebhookClaimStore.claim(eventId, 30000),
      AtomicWebhookClaimStore.claim(eventId, 30000),
      AtomicWebhookClaimStore.claim(eventId, 30000),
      AtomicWebhookClaimStore.claim(eventId, 30000),
    ]);

    const successfulClaims = claimAttempts.filter(c => c.claimed === true);
    const rejectedClaims = claimAttempts.filter(c => c.claimed === false);

    expect(successfulClaims.length).toBe(1);
    expect(rejectedClaims.length).toBe(4);
    expect(successfulClaims[0].status).toBe('processing');
    expect(rejectedClaims[0].status).toBe('processing');

    // Complete the event
    await AtomicWebhookClaimStore.complete(eventId);

    // Subsequent deliveries receive status 'done'
    const postDeliveryClaim = await AtomicWebhookClaimStore.claim(eventId, 30000);
    expect(postDeliveryClaim.claimed).toBe(false);
    expect(postDeliveryClaim.status).toBe('done');
  });

  it('crash-then-retry recovery: expired worker lease allows subsequent retry to reclaim and complete', async () => {
    const eventId = `evt_worker_crash_${Date.now()}`;

    // Worker 1 claims with very short 50ms lease
    const claim1 = await AtomicWebhookClaimStore.claim(eventId, 50);
    expect(claim1.claimed).toBe(true);

    // Immediate attempt while lease is active is rejected
    const claimImmediate = await AtomicWebhookClaimStore.claim(eventId, 50);
    expect(claimImmediate.claimed).toBe(false);

    // Wait for lease to expire (simulating worker crash / timeout)
    await new Promise(resolve => setTimeout(resolve, 60));

    // Worker 2 (retry delivery) attempts claim after lease expiry: must succeed
    const claim2 = await AtomicWebhookClaimStore.claim(eventId, 30000);
    expect(claim2.claimed).toBe(true);
    expect(claim2.status).toBe('processing');

    // Worker 2 completes processing
    await AtomicWebhookClaimStore.complete(eventId);

    // Final state is done
    const finalClaim = await AtomicWebhookClaimStore.claim(eventId, 30000);
    expect(finalClaim.claimed).toBe(false);
    expect(finalClaim.status).toBe('done');
  });
});
