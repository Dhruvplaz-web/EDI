import { NextRequest, NextResponse } from 'next/server';
import { RazorpayPaymentProvider } from '@/lib/payments/razorpay';
import { AtomicWebhookClaimStore } from '@/lib/stripe/idempotency';
import { adminDb } from '@/lib/firebase/server';

const razorpayProvider = new RazorpayPaymentProvider();

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET environment variable.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to read request body';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  // 1. Verify HMAC signature
  const verification = razorpayProvider.verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!verification.isValid || !verification.eventId) {
    console.error(`[Razorpay Webhook] Verification failed: ${verification.error}`);
    return NextResponse.json({ error: verification.error || 'Invalid signature' }, { status: 400 });
  }

  const eventId = verification.eventId;

  // 2. Atomic Idempotency Gate: Secure mutual exclusion claim with 60s lease
  const claimResult = await AtomicWebhookClaimStore.claim(eventId, 60000);
  if (!claimResult.claimed) {
    console.info(
      `[Razorpay Webhook] Idempotent skip for event ${eventId} (Status: ${claimResult.status}, Reason: ${claimResult.reason}). Returning 200 OK.`
    );
    return NextResponse.json({
      received: true,
      idempotentReplay: true,
      idempotentSkip: true,
      eventId,
      status: claimResult.status,
    });
  }

  try {
    const { eventType, orgId, tier, seats, subscriptionId } = verification;

    if (orgId && adminDb && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      const orgRef = adminDb.collection('organizations').doc(orgId);

      switch (eventType) {
        case 'subscription.charged':
        case 'subscription.authenticated': {
          await orgRef.set(
            {
              subscription: {
                tier: tier || 'starter',
                status: 'active',
                currentSeats: seats || 1,
                razorpaySubscriptionId: subscriptionId,
                updatedAt: Date.now(),
              },
            },
            { merge: true }
          );
          break;
        }

        case 'payment.failed':
        case 'subscription.halted': {
          await orgRef.set(
            {
              subscription: {
                status: 'past_due',
                pastDueSince: Date.now(),
                updatedAt: Date.now(),
              },
            },
            { merge: true }
          );
          break;
        }

        case 'subscription.cancelled': {
          await orgRef.set(
            {
              subscription: {
                status: 'canceled',
                canceledAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
            { merge: true }
          );
          break;
        }
      }
    }

    // Complete claim
    await AtomicWebhookClaimStore.complete(eventId);

    return NextResponse.json({
      received: true,
      eventId,
      eventType,
      processed: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Processing failure';
    console.error(`[Razorpay Webhook] Internal processing error for event ${eventId}:`, errorMsg);
    await AtomicWebhookClaimStore.fail(eventId, errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
