import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import { SAAS_PLANS, PlanTier } from '@/lib/stripe/plans';
import { cookies } from 'next/headers';
import { verifySignedSessionToken } from '@/lib/auth/session';

const checkoutSchema = z.object({
  tier: z.enum(['starter', 'professional', 'enterprise']),
  seats: z.number().int().min(1).max(1000),
  billingCycle: z.enum(['monthly', 'annual']),
  orgId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller via cryptographically verified session token
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    const verifiedSession = await verifySignedSessionToken(sessionCookie);
    if (!verifiedSession) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
    }

    const { role: userRole } = verifiedSession;
    if (!['super_admin', 'billing_admin', 'clinic_manager', 'clinical_director'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage clinic billing.' }, { status: 403 });
    }

    // 2. Validate input schema with Zod
    const body = await req.json();
    const parseResult = checkoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const { tier, seats, billingCycle, orgId, successUrl, cancelUrl } = parseResult.data;
    const plan = SAAS_PLANS[tier as PlanTier];

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // 3. Strict Production Ban on Mock Mode
    if (process.env.NODE_ENV === 'production' && !isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Production Error: Live Stripe keys must be configured. Mock mode is forbidden in production.' },
        { status: 500 }
      );
    }

    // Fallback mock response for dev/test environments only
    if (!isStripeConfigured()) {
      return NextResponse.json({
        url: `${baseUrl}/admin/billing?status=mock_checkout_success&tier=${tier}&seats=${seats}&orgId=${orgId}`,
        sessionId: `mock_cs_${Date.now()}`,
        mode: 'mock_sandbox',
        message: 'Stripe test mode: Set STRIPE_SECRET_KEY in production to generate live Stripe Checkout URLs.'
      });
    }

    // 4. Live Stripe Checkout Session Creation
    const priceId = billingCycle === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      subscription_data: {
        trial_period_days: plan.trialDays,
        metadata: {
          orgId,
          tier,
          seats: String(seats),
        },
      },
      metadata: {
        orgId,
        tier,
        seats: String(seats),
      },
      success_url: successUrl || `${baseUrl}/admin/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancelUrl || `${baseUrl}/admin/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal billing error';
    console.error('[Stripe Checkout API] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
