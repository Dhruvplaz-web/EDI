/**
 * Praxis AI - Multi-Factor Authentication (MFA) & Disaster Recovery Flow
 * 
 * Implements RFC 6238 Time-Based One-Time Password (TOTP) algorithm
 * with dynamic truncation and 30-second time steps.
 * 
 * Also provides cryptographically secure one-time backup recovery codes,
 * stored strictly as SHA-256 hashes to prevent recovery credential disclosure.
 */

import crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to Base32 string (RFC 4648)
 */
function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
function fromBase32(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a new Base32 secret for TOTP enrollment along with an otpauth:// URI.
 */
export function generateTotpSecret(userIdentifier: string, issuer: string = 'Praxis AI'): {
  secret: string;
  otpAuthUri: string;
} {
  const randomBytes = crypto.randomBytes(20);
  const secret = toBase32(randomBytes);
  const encodedLabel = `${encodeURIComponent(issuer)}:${encodeURIComponent(userIdentifier)}`;
  const encodedIssuer = encodeURIComponent(issuer);
  const otpAuthUri = `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  return { secret, otpAuthUri };
}

/**
 * Generates the 6-digit TOTP code for a given timestamp based on RFC 6238.
 */
export function generateTotpCode(secret: string, timestampMs: number = Date.now()): string {
  const key = fromBase32(secret);
  const counter = Math.floor(timestampMs / 1000 / 30);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuf);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = digest[digest.length - 1] & 0x0f;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const code = (codeInt % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verifies a 6-digit TOTP code against a secret with ±1 step (30s) drift tolerance.
 */
export function verifyTotpCode(
  secret: string,
  userCode: string,
  timestampMs: number = Date.now()
): boolean {
  if (!userCode || userCode.trim().length !== 6) return false;
  const target = userCode.trim();

  // Test current step and ±1 step
  const steps = [0, -30000, 30000];
  for (const drift of steps) {
    const candidate = generateTotpCode(secret, timestampMs + drift);
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(target))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an array of secure random one-time backup recovery codes formatted as `XXXX-XXXX`.
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous chars (omitting 0, O, 1, I)

  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    const bytes = crypto.randomBytes(8);
    for (let j = 0; j < 4; j++) {
      part1 += chars[bytes[j] % chars.length];
      part2 += chars[bytes[j + 4] % chars.length];
    }
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Computes a SHA-256 hash of a recovery code for secure database storage.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verifies and redeems a one-time recovery code from a stored list of SHA-256 hashes.
 * If valid, returns success and the remaining list without the redeemed code.
 */
export function verifyAndRedeemRecoveryCode(
  providedCode: string,
  storedHashedCodes: string[]
): {
  success: boolean;
  remainingHashedCodes: string[];
} {
  const targetHash = hashRecoveryCode(providedCode);
  const matchIndex = storedHashedCodes.indexOf(targetHash);

  if (matchIndex === -1) {
    return {
      success: false,
      remainingHashedCodes: [...storedHashedCodes],
    };
  }

  const remaining = [...storedHashedCodes];
  remaining.splice(matchIndex, 1);

  return {
    success: true,
    remainingHashedCodes: remaining,
  };
}
