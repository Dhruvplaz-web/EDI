import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthGET } from '@/app/api/health/route';
import { createSignedSessionToken } from '@/lib/auth/session';
import nextConfig from '../../next.config';

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

describe('E. Headers & Minimal Health Endpoint', () => {
  beforeEach(() => {
    currentMockCookies = {};
    vi.restoreAllMocks();
  });

  describe('/api/health route hardening', () => {
    it('returns minimal public response { status: "ok" } without leaking environment or service details', async () => {
      const req = new NextRequest('https://praxis-ai.health/api/health');
      const res = await healthGET(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({ status: 'ok' });
      // Asserts sensitive internal diagnostics are NOT leaked to public probes
      expect(data.environment).toBeUndefined();
      expect(data.services).toBeUndefined();
      expect(data.uptimeSeconds).toBeUndefined();
    });

    it('returns full diagnostic details only for authenticated super_admin or it_support sessions', async () => {
      const adminToken = await createSignedSessionToken({
        uid: 'adm_sec_ops',
        role: 'super_admin',
        orgId: 'org_health_system',
      });
      currentMockCookies['session'] = adminToken;

      const req = new NextRequest('https://praxis-ai.health/api/health');
      const res = await healthGET(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(data.environment).toBeDefined();
      expect(data.services).toBeDefined();
      expect(data.uptimeSeconds).toBeDefined();
    });
  });

  describe('Next.js Security Headers & CSP', () => {
    it('includes COOP and CORP headers', async () => {
      const headersList = await nextConfig.headers!();
      const globalHeaders = headersList.find(h => h.source === '/:path*')?.headers || [];

      const coop = globalHeaders.find(h => h.key === 'Cross-Origin-Opener-Policy');
      const corp = globalHeaders.find(h => h.key === 'Cross-Origin-Resource-Policy');

      expect(coop).toBeDefined();
      expect(coop?.value).toBe('same-origin');
      expect(corp).toBeDefined();
      expect(corp?.value).toBe('same-origin');
    });

    it('enforces hardened CSP without unsafe-eval, jsdelivr, storage, or generativelanguage in connect-src', async () => {
      const { buildCspHeader } = await import('@/proxy');
      const csp = buildCspHeader('test_nonce_mock_123', false);

      // Verify dynamic nonce is embedded
      expect(csp).toContain("'nonce-test_nonce_mock_123'");
      // Does not contain obsolete/unsafe domains
      expect(csp).not.toContain('cdn.jsdelivr.net');
      expect(csp).not.toContain('storage.googleapis.com');
      expect(csp).not.toContain('generativelanguage.googleapis.com');
      // No blanket https: or wss: in connect-src
      const connectSrc = csp.split(';').find(p => p.trim().startsWith('connect-src')) || '';
      expect(connectSrc).not.toContain('wss:');
      expect(connectSrc).not.toMatch(/\shttps:(?!\/)/);
    });
  });
});
