import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { GET as devLoginGET } from '@/app/api/dev-login/route';
import { verifySignedSessionToken } from '@/lib/auth/session';

const mockSetCookie = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string, options?: Record<string, unknown>) => mockSetCookie(name, value, options),
  }),
}));

describe('SEC-01 & SEC-02: Dev Login Production Safety Gate', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockSetCookie.mockClear();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it('dev-login MUST return 404 Not Found in a production build', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const req = new Request('https://praxis-ai.health/api/dev-login?role=super_admin');
    const res = await devLoginGET(req);

    // Strict 404 gate in production
    expect(res.status).toBe(404);
  });

  it('dev-login issues a valid cryptographically signed session in development mode', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

    const req = new Request('https://localhost:3000/api/dev-login?role=clinician');
    const res = await devLoginGET(req);

    // Expect redirect in dev
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/clinical/queue');

    // Verify cookie set call
    expect(mockSetCookie).toHaveBeenCalled();
    const sessionCall = mockSetCookie.mock.calls.find((call) => call[0] === 'session');
    expect(sessionCall).toBeDefined();

    const tokenValue = sessionCall?.[1];
    expect(tokenValue).toBeTruthy();

    // Verify token cryptographic HMAC signature
    const verified = await verifySignedSessionToken(tokenValue);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('clinician');
    expect(verified?.orgId).toBe('org_praxis_demo');
  });
});
