import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { POST as generateSoapPOST } from '@/app/api/clinical/generate-soap/route';
import { POST as checkoutPOST } from '@/app/api/stripe/checkout/route';
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

describe('SEC-03: Cryptographic Session Signature & Forged Cookie Protection', () => {
  beforeEach(() => {
    currentMockCookies = {};
    vi.restoreAllMocks();
  });

  describe('Proxy Route Protection Against Forged Cookies', () => {
    const protectedPaths = [
      '/clinical/queue',
      '/clinical/consult/patient_123',
      '/admin/dashboard',
      '/admin/billing',
      '/patient/dashboard',
      '/operations/dashboard',
    ];

    it.each(protectedPaths)(
      'rejects forged user_role=super_admin with garbage session on %s and redirects to /login',
      async (path) => {
        const req = new NextRequest(`https://praxis-ai.health${path}`, {
          headers: {
            cookie: 'user_role=super_admin; session=garbage_unverified_token_attacker_string',
          },
        });

        const res = await proxy(req);

        // Expect redirect to login with redirect param
        expect(res.status).toBe(307);
        const location = res.headers.get('location');
        expect(location).toContain('/login');
        expect(location).toContain(`redirect=${encodeURIComponent(path)}`);
      }
    );

    it('rejects forged user_role=super_admin on protected clinical API and returns 401 Unauthorized', async () => {
      const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
        headers: {
          cookie: 'user_role=super_admin; session=garbage_signature_attacker_string',
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Valid cryptographically signed session required');
    });

    it('allows access and forwards verified identity when valid cryptographically signed session is provided', async () => {
      const validToken = await createSignedSessionToken({
        uid: 'dr_verified_123',
        role: 'clinician',
        orgId: 'org_verified_health',
      });

      const req = new NextRequest('https://praxis-ai.health/clinical/queue', {
        headers: {
          cookie: `session=${validToken}; user_role=attacker_forged_ignore_me`,
        },
      });

      const res = await proxy(req);
      // Next response passes through (200) with forwarded verified headers
      expect(res.status).toBe(200);
      expect(res.headers.get('x-verified-uid')).toBe('dr_verified_123');
      expect(res.headers.get('x-verified-role')).toBe('clinician');
      expect(res.headers.get('x-verified-org')).toBe('org_verified_health');
    });
  });

  describe('API Routes: Cryptographic Session Signature Verification', () => {
    it('/api/clinical/generate-soap returns 401 when forged user_role=super_admin and session=garbage is sent', async () => {
      currentMockCookies = {
        user_role: 'super_admin',
        session: 'garbage_forged_cookie_value_12345',
      };

      const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: 'PAT-101',
          patientName: 'Jane Doe',
          patientConsentToken: 'consent_123',
        }),
      });

      const res = await generateSoapPOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Cryptographically verified session required');
    });

    it('/api/stripe/checkout returns 401 when forged user_role=super_admin and session=garbage is sent', async () => {
      currentMockCookies = {
        user_role: 'super_admin',
        session: 'garbage_forged_cookie_value_12345',
      };

      const req = new NextRequest('https://praxis-ai.health/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'starter',
          seats: 2,
          billingCycle: 'monthly',
          orgId: 'org_test',
        }),
      });

      const res = await checkoutPOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Valid session required');
    });
  });
});
