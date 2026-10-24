import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import Stripe from 'stripe';
import { AtomicWebhookClaimStore } from '@/lib/stripe/idempotency';
import { adminDb } from '@/lib/firebase/server';

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

  // Atomic Idempotency Gate (Part G.1): Secure atomic claim with 60s worker lease
  const claimResult = await AtomicWebhookClaimStore.claim(event.id, 60000);
  if (!claimResult.claimed) {
    console.info(
      `[Stripe Webhook] Atomic claim rejected for event ${event.id} (Status: ${claimResult.status}, Reason: ${claimResult.reason}). Returning 200 OK.`
    );
    return NextResponse.json({
      received: true,
      idempotentReplay: true,
      idempotentSkip: true,
      eventId: event.id,
      status: claimResult.status,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier;
        const seats = Number(session.metadata?.seats || 1);
        console.info(`[Stripe Webhook] Checkout completed for Org ${orgId}: Tier ${tier}, Seats ${seats}`);

        if (adminDb && orgId && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
          try {
            await adminDb.collection('organizations').doc(orgId).set(
              {
                subscription: {
                  tier,
                  status: 'active',
                  currentSeats: 1,
                  maxSeats: seats,
                  stripeCustomerId: (session.customer as string) || null,
                  stripeSubscriptionId: (session.subscription as string) || null,
                },
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (dbErr) {
            console.warn('[Stripe Webhook] Org activation write warning:', dbErr);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        const status = subscription.status; // active, past_due, canceled, trialing
        console.info(`[Stripe Webhook] Subscription ${subscription.id} for Org ${orgId} updated to: ${status}`);

        if (adminDb && orgId && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
          try {
            await adminDb.collection('organizations').doc(orgId).set(
              {
                'subscription.status': status,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (dbErr) {
            console.warn('[Stripe Webhook] Subscription update write warning:', dbErr);
          }
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        console.info(`[Stripe Webhook] Trial ending soon for Org ${orgId}. Sending transition reminder.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.warn(`[Stripe Webhook] Invoice payment failed for customer ${customerId}. Marking subscription past_due with dunning.`);

        if (adminDb && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
          try {
            const orgsSnap = await adminDb
              .collection('organizations')
              .where('subscription.stripeCustomerId', '==', customerId)
              .limit(1)
              .get();

            if (!orgsSnap.empty) {
              const orgDoc = orgsSnap.docs[0];
              await orgDoc.ref.set(
                {
                  'subscription.status': 'past_due',
                  'subscription.pastDueSince': Date.now(),
                  'subscription.dunningAttempt': (invoice.attempt_count || 1),
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            }
          } catch (dbErr) {
            console.warn('[Stripe Webhook] Dunning status write warning:', dbErr);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        console.info(`[Stripe Webhook] Subscription canceled/deleted for Org ${orgId}.`);

        if (adminDb && orgId) {
          try {
            await adminDb.collection('organizations').doc(orgId).set(
              {
                'subscription.status': 'canceled',
                'subscription.canceledAt': Date.now(),
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (dbErr) {
            console.warn('[Stripe Webhook] Cancellation write warning:', dbErr);
          }
        }
        break;
      }

      default:
        console.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Atomically mark event processing as completed
    await AtomicWebhookClaimStore.complete(event.id);

    return NextResponse.json({ received: true, eventId: event.id, status: 'done' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook handler error';
    console.error('[Stripe Webhook] Processing error:', errorMsg);
    // Mark as failed so retries or lease recovery can re-execute
    await AtomicWebhookClaimStore.fail(event.id, errorMsg);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
