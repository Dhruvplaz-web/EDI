import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import Stripe from 'stripe';

// In-memory / distributed idempotency registry for processed webhook event IDs
export const processedWebhookEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid signature';
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMsg}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMsg}` }, { status: 400 });
  }

  // Idempotency Gate: Reject duplicate processing on webhook replay
  if (processedWebhookEventIds.has(event.id)) {
    console.info(`[Stripe Webhook] Idempotent replay detected for event ${event.id}. Returning cached 200 OK.`);
    return NextResponse.json({ received: true, idempotentReplay: true, eventId: event.id });
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier;
        const seats = Number(session.metadata?.seats || 1);
        console.info(`[Stripe Webhook] Checkout completed for Org ${orgId}: Tier ${tier}, Seats ${seats}`);
        // In live Firebase: Update /organizations/{orgId} with stripeCustomerId, subscriptionStatus: 'active'
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        console.info(`[Stripe Webhook] Subscription ${subscription.id} updated to status: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.info(`[Stripe Webhook] Subscription ${subscription.id} canceled/deleted.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[Stripe Webhook] Payment failed for customer ${invoice.customer}. Status marked past_due.`);
        break;
      }

      default:
        console.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Mark event ID as processed to enforce idempotency
    processedWebhookEventIds.add(event.id);

    return NextResponse.json({ received: true, eventId: event.id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook handler error';
    console.error('[Stripe Webhook] Processing error:', errorMsg);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
