import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as checkoutPOST } from '@/app/api/stripe/checkout/route';
import { POST as portalPOST } from '@/app/api/stripe/portal/route';
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

describe('A.5: Billing Role Gating & Cross-Tenant OrgId IDOR Protection', () => {
  beforeEach(() => {
    currentMockCookies = {};
    vi.restoreAllMocks();
  });

  it('rejects /api/stripe/checkout when a billing_admin tries to bill for a DIFFERENT orgId in body', async () => {
    // Admin belongs to org_clinic_1
    const token = await createSignedSessionToken({
      uid: 'user_billing_admin_1',
      role: 'billing_admin',
      orgId: 'org_clinic_1',
    });
    currentMockCookies['session'] = token;

    // Attacker sends request trying to checkout for org_victim_2
    const req = new NextRequest('https://praxis-ai.health/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'enterprise',
        seats: 10,
        billingCycle: 'monthly',
        orgId: 'org_victim_2', // Attempted cross-tenant IDOR
      }),
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Cross-tenant billing modification denied');
  });

  it('rejects /api/stripe/portal when caller tries to manage a DIFFERENT orgId in body', async () => {
    const token = await createSignedSessionToken({
      uid: 'user_clinic_mgr_1',
      role: 'clinic_manager',
      orgId: 'org_clinic_1',
    });
    currentMockCookies['session'] = token;

    const req = new NextRequest('https://praxis-ai.health/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: 'org_victim_2',
      }),
    });

    const res = await portalPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Cross-tenant billing modification denied');
  });

  it('allows billing_admin to checkout for their OWN orgId', async () => {
    const token = await createSignedSessionToken({
      uid: 'user_billing_admin_1',
      role: 'billing_admin',
      orgId: 'org_clinic_1',
    });
    currentMockCookies['session'] = token;

    const req = new NextRequest('https://praxis-ai.health/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'professional',
        seats: 5,
        billingCycle: 'monthly',
        orgId: 'org_clinic_1',
      }),
    });

    const res = await checkoutPOST(req);
    // In test environment, returns 200 with sandbox URL scoped to org_clinic_1
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toContain('orgId=org_clinic_1');
  });
});
