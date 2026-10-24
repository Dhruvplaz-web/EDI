import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Next.js cookies() from next/headers to test unauthenticated rejection safely
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

import { GET as healthHandler } from '@/app/api/health/route';
import { GET as devLoginHandler } from '@/app/api/dev-login/route';
import { POST as checkoutHandler } from '@/app/api/stripe/checkout/route';
import { POST as generateSoapHandler } from '@/app/api/clinical/generate-soap/route';

describe('Integration: API Route Handlers & Security Gates', () => {
  it('GET /api/health returns 200 with healthy uptime and configured services', async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.services).toBeDefined();
    expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/dev-login returns 404 in production environment (SEC-01)', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // Emulate production environment
      process.env.NODE_ENV = 'production';
      const req = new NextRequest('http://localhost:3000/api/dev-login?role=super_admin');
      const res = await devLoginHandler(req);

      expect(res.status).toBe(404);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('POST /api/stripe/checkout returns 401 when caller has no authenticated session', async () => {
    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        tier: 'professional',
        seats: 5,
        billingCycle: 'annual',
        orgId: 'org_test_123'
      })
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('POST /api/clinical/generate-soap returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/clinical/generate-soap', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'PAT-123',
        patientName: 'Jane Doe',
      })
    });

    const res = await generateSoapHandler(req);
    expect(res.status).toBe(401);
  });
});
