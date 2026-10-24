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

    it.each([
      '/clinical/consult/x.png',
      '/patient/consult/x.jpg',
      '/clinical/records/x.svg',
    ])('rejects unauthenticated request to %s and redirects to /login (no extension-based bypass)', async (bypassPath) => {
      const req = new NextRequest(`https://praxis-ai.health${bypassPath}`);
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain(`redirect=${encodeURIComponent(bypassPath)}`);
    });

    it('Part F: allows unauthenticated access to explicitly allowlisted /assets/logo.svg and /favicon.ico', async () => {
      const reqAsset = new NextRequest('https://praxis-ai.health/assets/logo.svg');
      const resAsset = await proxy(reqAsset);
      expect(resAsset.status).toBe(200);

      const reqFavicon = new NextRequest('https://praxis-ai.health/favicon.ico');
      const resFavicon = await proxy(reqFavicon);
      expect(resFavicon.status).toBe(200);

      // Verify dynamic nonce-based CSP header is present
      const csp = resAsset.headers.get('Content-Security-Policy');
      expect(csp).toContain("script-src 'self' 'nonce-");
      expect(csp).toContain("connect-src 'self' https://firestore.googleapis.com");
    });

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
      // Next response passes through (200) without leaking verified headers back to client (A.4)
      expect(res.status).toBe(200);
      expect(res.headers.get('x-verified-uid')).toBeNull();
      expect(res.headers.get('x-verified-role')).toBeNull();
      expect(res.headers.get('x-verified-org')).toBeNull();
    });

    it('strips incoming forged x-verified-* headers on every request', async () => {
      const req = new NextRequest('https://praxis-ai.health/api/health', {
        headers: {
          'x-verified-uid': 'attacker_uid',
          'x-verified-role': 'super_admin',
          'x-verified-org': 'attacker_org',
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('x-verified-uid')).toBeNull();
      expect(res.headers.get('x-verified-role')).toBeNull();
    });

    it('sanitizes ?redirect= parameter preventing open redirects', async () => {
      const validToken = await createSignedSessionToken({
        uid: 'dr_verified_123',
        role: 'clinician',
        orgId: 'org_verified_health',
      });

      // Malicious protocol-relative open redirect
      const req = new NextRequest('https://praxis-ai.health/login?redirect=//evil.com', {
        headers: {
          cookie: `session=${validToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      // Should redirect to default dashboard /clinical/queue, NEVER //evil.com
      expect(location).toContain('/clinical/queue');
      expect(location).not.toContain('//evil.com');
    });

    it('gates /api/stripe/checkout strictly to billing administrators', async () => {
      const clinicianToken = await createSignedSessionToken({
        uid: 'dr_verified_123',
        role: 'clinician', // Not billing admin
        orgId: 'org_verified_health',
      });

      const req = new NextRequest('https://praxis-ai.health/api/stripe/checkout', {
        headers: {
          cookie: `session=${clinicianToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Billing administrative role required');
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
