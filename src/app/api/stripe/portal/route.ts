import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import { cookies } from 'next/headers';

const portalSchema = z.object({
  customerId: z.string().optional(),
  orgId: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    if (!['super_admin', 'billing_admin', 'clinic_manager', 'clinical_director'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = portalSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const { customerId, orgId, returnUrl } = parseResult.data;
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    if (!isStripeConfigured() || !customerId) {
      return NextResponse.json({
        url: `${baseUrl}/admin/billing?status=mock_portal&orgId=${orgId}`,
        mode: 'mock_sandbox',
        message: 'Stripe test mode: Set live STRIPE_SECRET_KEY to enable customer portal redirection.'
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${baseUrl}/admin/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal portal error';
    console.error('[Stripe Portal API] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
