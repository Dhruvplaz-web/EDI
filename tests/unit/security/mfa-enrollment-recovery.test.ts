import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyAndRedeemRecoveryCode,
} from '@/lib/auth/mfa';

describe('MFA Enrollment & Recovery Flow (RFC 6238 TOTP & One-Time Recovery Codes)', () => {
  it('generates a valid Base32 secret and valid otpauth URI', () => {
    const { secret, otpAuthUri } = generateTotpSecret('dr_jenkins@praxis.internal');
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThanOrEqual(16);
    expect(otpAuthUri).toContain('otpauth://totp/Praxis%20AI:dr_jenkins%40praxis.internal');
    expect(otpAuthUri).toContain(`secret=${secret}`);
  });

  it('generates and verifies valid RFC 6238 TOTP codes with ±1 time step tolerance', () => {
    const { secret } = generateTotpSecret('clinician@praxis.internal');
    const now = Date.now();

    // Current code must verify
    const currentCode = generateTotpCode(secret, now);
    expect(verifyTotpCode(secret, currentCode, now)).toBe(true);

    // Code from 30 seconds ago should verify with tolerance
    const pastCode = generateTotpCode(secret, now - 30000);
    expect(verifyTotpCode(secret, pastCode, now)).toBe(true);

    // Completely incorrect or spoofed code must fail
    expect(verifyTotpCode(secret, '000000', now)).toBe(false);
    expect(verifyTotpCode(secret, '999999', now)).toBe(false);

    // Code outside tolerance window (e.g. 5 minutes ago) must fail
    const expiredCode = generateTotpCode(secret, now - 300000);
    expect(verifyTotpCode(secret, expiredCode, now)).toBe(false);
  });

  it('generates 8 distinct, secure backup recovery codes', () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    
    // All codes must be unique and formatted as XXXX-XXXX
    const unique = new Set(codes);
    expect(unique.size).toBe(8);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  it('redeems a recovery code once and rejects duplicate redemption', () => {
    const plainCodes = generateRecoveryCodes(8);
    const hashedStore = plainCodes.map(hashRecoveryCode);

    const testCode = plainCodes[0];

    // First redemption must succeed
    const firstRedemption = verifyAndRedeemRecoveryCode(testCode, hashedStore);
    expect(firstRedemption.success).toBe(true);
    expect(firstRedemption.remainingHashedCodes).toHaveLength(7);

    // Second redemption of the exact same one-time code must fail
    const secondRedemption = verifyAndRedeemRecoveryCode(testCode, firstRedemption.remainingHashedCodes);
    expect(secondRedemption.success).toBe(false);
    expect(secondRedemption.remainingHashedCodes).toHaveLength(7);

    // Invalid code must fail
    const invalidRedemption = verifyAndRedeemRecoveryCode('INVALID-CODE', firstRedemption.remainingHashedCodes);
    expect(invalidRedemption.success).toBe(false);
  });
});
