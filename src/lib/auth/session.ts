/**
 * Praxis AI - Cryptographic Session & Token Management (HMAC-SHA256)
 * 
 * Enforces verifiable session signatures across Next.js Middleware/Proxy and API routes.
 * Derives role and orgId strictly from the cryptographically verified payload,
 * NEVER trusting raw, unverified client cookies.
 */

export interface VerifiedSessionPayload {
  uid: string;
  role: 'super_admin' | 'clinical_director' | 'clinician' | 'patient' | 'operations' | 'billing_admin' | 'clinic_manager' | 'it_support' | 'nurse' | 'specialist';
  orgId: string;
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = 'praxis_dev_secret_key_change_in_production_32bytes!!';

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.FIREBASE_PRIVATE_KEY || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a cryptographically signed session token (HMAC-SHA256)
 */
export async function createSignedSessionToken(
  payload: Omit<VerifiedSessionPayload, 'iat' | 'exp'>,
  expiresInSeconds: number = 60 * 60 * 8 // 8 hours
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: VerifiedSessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadString = JSON.stringify(fullPayload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadString));

  const key = await crypto.subtle.importKey(
    'raw',
    getAuthSecret(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Cryptographically verifies session token.
 * Returns null if token is malformed, signature is invalid, or token is expired.
 */
export async function verifySignedSessionToken(token: string | undefined): Promise<VerifiedSessionPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      getAuthSecret(),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlDecode(signatureB64);
    const dataBytes = new TextEncoder().encode(payloadB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      dataBytes
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload: VerifiedSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
