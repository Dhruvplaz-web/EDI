import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession } from '@/app/actions/auth';
import { adminAuth } from '@/lib/firebase/server';

const mockSetCookie = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mockSetCookie,
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Item 1: createSession Custom Claims & Universal Staff MFA Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.AUTH_SECRET = 'a_secure_production_auth_secret_with_more_than_32_characters!!';
    process.env.FIREBASE_PROJECT_ID = 'praxis-test-project';
    delete process.env.ENABLE_DEV_LOGIN;
  });

  it('rejects login when token has no claims even if clientRole="super_admin" is passed', async () => {
    // Mock verifyIdToken returning valid token without custom claims (role & orgId missing)
    vi.spyOn(adminAuth!, 'verifyIdToken').mockResolvedValueOnce({
      uid: 'user_attacker_1',
      auth_time: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/praxis-test',
      aud: 'praxis-test',
      sub: 'user_attacker_1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: { identities: {}, sign_in_provider: 'password' },
    } as unknown as import('firebase-admin/auth').DecodedIdToken);

    const result = await createSession('valid_id_token_no_claims', 'super_admin');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Missing mandatory custom claims/i);
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  it('rejects login when token has role claim but is missing orgId claim', async () => {
    vi.spyOn(adminAuth!, 'verifyIdToken').mockResolvedValueOnce({
      uid: 'user_clinician_no_org',
      role: 'clinician',
      auth_time: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/praxis-test',
      aud: 'praxis-test',
      sub: 'user_clinician_no_org',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: { identities: {}, sign_in_provider: 'password' },
    } as unknown as import('firebase-admin/auth').DecodedIdToken);

    const result = await createSession('valid_id_token_no_org');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Missing mandatory custom claims/i);
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  it('enforces MFA for nurse role without second factor', async () => {
    vi.spyOn(adminAuth!, 'verifyIdToken').mockResolvedValueOnce({
      uid: 'user_nurse_1',
      role: 'nurse',
      orgId: 'org_summit_1',
      auth_time: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/praxis-test',
      aud: 'praxis-test',
      sub: 'user_nurse_1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: { identities: {}, sign_in_provider: 'password' }, // No sign_in_second_factor
    } as unknown as import('firebase-admin/auth').DecodedIdToken);

    const result = await createSession('valid_nurse_token');
    expect(result.success).toBe(false);
    expect(result.code).toBe('MFA_REQUIRED');
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  it('enforces MFA for specialist and medical_assistant roles without second factor', async () => {
    for (const staffRole of ['specialist', 'medical_assistant', 'operations'] as const) {
      vi.spyOn(adminAuth!, 'verifyIdToken').mockResolvedValueOnce({
        uid: `user_${staffRole}_1`,
        role: staffRole,
        orgId: 'org_summit_1',
        auth_time: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/praxis-test',
        aud: 'praxis-test',
        sub: `user_${staffRole}_1`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { identities: {}, sign_in_provider: 'password' },
      } as unknown as import('firebase-admin/auth').DecodedIdToken);

      const result = await createSession(`token_${staffRole}`);
      expect(result.success).toBe(false);
      expect(result.code).toBe('MFA_REQUIRED');
    }
  });

  it('succeeds when verified claims exist and MFA second factor is present for staff', async () => {
    vi.spyOn(adminAuth!, 'verifyIdToken').mockResolvedValueOnce({
      uid: 'user_nurse_verified',
      role: 'nurse',
      orgId: 'org_summit_1',
      auth_time: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/praxis-test',
      aud: 'praxis-test',
      sub: 'user_nurse_verified',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        identities: {},
        sign_in_provider: 'password',
        sign_in_second_factor: 'totp',
      },
    } as unknown as import('firebase-admin/auth').DecodedIdToken);

    const result = await createSession('valid_nurse_token_with_mfa');
    expect(result.success).toBe(true);
    expect(mockSetCookie).toHaveBeenCalled();
  });
});
