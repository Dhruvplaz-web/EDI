import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { GET as devLoginGET } from '@/app/api/dev-login/route';
import { verifySignedSessionToken } from '@/lib/auth/session';

const mockSetCookie = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string, options?: Record<string, unknown>) => mockSetCookie(name, value, options),
  }),
}));

describe('SEC-01 & A.6: Dev Login Dual Gate (NODE_ENV & ENABLE_DEV_LOGIN)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalEnableDevLogin = process.env.ENABLE_DEV_LOGIN;

  beforeEach(() => {
    mockSetCookie.mockClear();
    process.env.ENABLE_DEV_LOGIN = 'false';
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    process.env.ENABLE_DEV_LOGIN = originalEnableDevLogin;
  });

  it('dev-login returns 404 Not Found in production build regardless of ENABLE_DEV_LOGIN', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.ENABLE_DEV_LOGIN = 'true';

    const req = new Request('https://praxis-ai.health/api/dev-login?role=super_admin');
    const res = await devLoginGET(req);

    // Strict 404 gate in production
    expect(res.status).toBe(404);
  });

  it('dev-login returns 404 in development if ENABLE_DEV_LOGIN is not true', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.ENABLE_DEV_LOGIN = 'false';

    const req = new Request('https://localhost:3000/api/dev-login?role=clinician');
    const res = await devLoginGET(req);

    expect(res.status).toBe(404);
  });

  it('dev-login issues signed session token and redirects when ENABLE_DEV_LOGIN=true in dev', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.ENABLE_DEV_LOGIN = 'true';

    const req = new Request('https://localhost:3000/api/dev-login?role=clinician');
    const res = await devLoginGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/clinical/queue');

    // Verify session cookie set call
    expect(mockSetCookie).toHaveBeenCalled();
    const sessionCall = mockSetCookie.mock.calls.find((call) => call[0] === 'session');
    expect(sessionCall).toBeDefined();

    // Verify user_role cookie is NEVER set (A.4)
    const userRoleCall = mockSetCookie.mock.calls.find((call) => call[0] === 'user_role');
    expect(userRoleCall).toBeUndefined();

    // Verify token cryptographic signature
    const tokenValue = sessionCall?.[1];
    const verified = await verifySignedSessionToken(tokenValue);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('clinician');
    expect(verified?.orgId).toBe('org_praxis_demo');
  });
});
