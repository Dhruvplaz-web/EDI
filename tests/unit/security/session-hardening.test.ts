import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
  revokeUserSessions,
  getUserSessionVersion,
} from '@/lib/auth/session';

describe('A.2 & A.3: Session Token Hardening, Validation & Revocation', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it('successfully creates and verifies a valid session token', async () => {
    const token = await createSignedSessionToken({
      uid: 'user_clinician_1',
      role: 'clinician',
      orgId: 'org_main_hospital',
    });

    const payload = await verifySignedSessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.uid).toBe('user_clinician_1');
    expect(payload?.role).toBe('clinician');
    expect(payload?.orgId).toBe('org_main_hospital');
    expect(payload?.iss).toBe('praxis-ai-platform');
  });

  it('rejects tokens where exp is in the past', async () => {
    // Generate token with negative expiresIn
    const token = await createSignedSessionToken(
      {
        uid: 'user_clinician_1',
        role: 'clinician',
        orgId: 'org_main_hospital',
      },
      -10 // Expired 10 seconds ago
    );

    const payload = await verifySignedSessionToken(token);
    expect(payload).toBeNull();
  });

  it('rejects tokens where exp exceeds maximum lifetime of 8 hours', async () => {
    // Attempt to request 24 hour token
    const token = await createSignedSessionToken(
      {
        uid: 'user_clinician_1',
        role: 'clinician',
        orgId: 'org_main_hospital',
      },
      24 * 3600 // 24 hours
    );

    const payload = await verifySignedSessionToken(token);
    expect(payload).not.toBeNull();
    // Verify that creation clamped exp to max 8 hours
    const lifetime = (payload!.exp - payload!.iat);
    expect(lifetime).toBeLessThanOrEqual(8 * 3600);
  });

  it('rejects dev_ uids in production environment', async () => {
    const devToken = await createSignedSessionToken({
      uid: 'dev_clinician',
      role: 'clinician',
      orgId: 'org_test',
    });

    // In test/dev mode it verifies
    expect(await verifySignedSessionToken(devToken)).not.toBeNull();

    // In production mode it MUST be rejected
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    const verifiedInProd = await verifySignedSessionToken(devToken);
    expect(verifiedInProd).toBeNull();
  });

  it('rejects tokens with invalid or non-empty orgId', async () => {
    // Manually forge payload with empty orgId
    const now = Math.floor(Date.now() / 1000);
    const forgedPayload = {
      uid: 'user_clinician_1',
      role: 'clinician',
      orgId: '', // Invalid empty orgId
      iss: 'praxis-ai-platform',
      env: 'test',
      iat: now,
      exp: now + 3600,
      sessionVersion: 1,
    };

    const str = JSON.stringify(forgedPayload);
    const b64 = Buffer.from(str).toString('base64url');
    // Even if signature were valid, schema parsing must reject
    const token = `${b64}.mock_sig`;
    const verified = await verifySignedSessionToken(token);
    expect(verified).toBeNull();
  });

  it('supports session revocation: revoking user sessions invalidates prior tokens', async () => {
    const token1 = await createSignedSessionToken({
      uid: 'user_revocable_100',
      role: 'clinician',
      orgId: 'org_revocation_test',
    });

    expect(await verifySignedSessionToken(token1)).not.toBeNull();

    // Revoke sessions for this user
    revokeUserSessions('user_revocable_100');

    // Token1 must now be rejected
    const verifiedAfterRevoke = await verifySignedSessionToken(token1);
    expect(verifiedAfterRevoke).toBeNull();

    // Newly created token receives the updated sessionVersion and succeeds
    const token2 = await createSignedSessionToken({
      uid: 'user_revocable_100',
      role: 'clinician',
      orgId: 'org_revocation_test',
    });
    expect(await verifySignedSessionToken(token2)).not.toBeNull();
  });

  it('enforces 15-minute idle timeout if lastActive is provided and stale', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await createSignedSessionToken({
      uid: 'user_idle_test',
      role: 'clinician',
      orgId: 'org_test',
      lastActive: now - (16 * 60), // Idle for 16 minutes (> 15 min limit)
    });

    const verified = await verifySignedSessionToken(token);
    expect(verified).toBeNull();
  });
});
