/**
 * Praxis AI - Cryptographic Session & Token Management (HMAC-SHA256)
 * 
 * Enforces verifiable session signatures across Next.js Middleware/Proxy and API routes.
 * Derives role and orgId strictly from the cryptographically verified payload,
 * NEVER trusting raw, unverified client cookies.
 */

import { z } from 'zod';

export const RolesList = [
  'super_admin',
  'clinical_director',
  'clinician',
  'patient',
  'operations',
  'billing_admin',
  'clinic_manager',
  'it_support',
  'nurse',
  'specialist',
  'guardian',
  'medical_assistant',
] as const;

export type UserRole = (typeof RolesList)[number];

export const SessionPayloadSchema = z.object({
  uid: z.string().min(1, 'uid cannot be empty'),
  role: z.enum(RolesList),
  orgId: z.string().min(1, 'orgId cannot be empty'),
  iss: z.literal('praxis-ai-platform').default('praxis-ai-platform'),
  env: z.enum(['development', 'test', 'production']).default(
    (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development'
  ),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  lastActive: z.number().int().positive().optional(),
  sessionVersion: z.number().int().nonnegative().default(1),
});

export type VerifiedSessionPayload = z.infer<typeof SessionPayloadSchema>;

const DEV_DEFAULT_SECRET = 'praxis_dev_secret_key_change_in_production_32bytes!!';

// Local memory cache for session versions (fast path)
export const userSessionVersions = new Map<string, number>();

export async function getPersistentSessionVersion(uid: string): Promise<number> {
  const isProduction = process.env.NODE_ENV === 'production';
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Check Upstash Redis if configured
  if (upstashUrl && upstashToken) {
    try {
      const res = await fetch(`${upstashUrl}/get/session_version:${uid}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result !== null && data.result !== undefined) {
          const v = Number(data.result);
          userSessionVersions.set(uid, v);
          return v;
        }
      }
    } catch (err) {
      console.warn('[Session] Redis version lookup warning:', err);
      if (isProduction) return -1; // Signal failure to fail-closed
    }
  }

  // 2. Check Firestore if configured
  if (process.env.FIREBASE_PROJECT_ID && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    try {
      const { adminDb } = await import('@/lib/firebase/server');
      if (adminDb) {
        const fetchPromise = adminDb.collection('session_versions').doc(uid).get();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
        const doc = await Promise.race([fetchPromise, timeoutPromise]);
        if (doc && 'exists' in doc && doc.exists) {
          const v = doc.data()?.sessionVersion || 1;
          userSessionVersions.set(uid, v);
          return v;
        }
      }
    } catch (err) {
      console.warn('[Session] Firestore version lookup warning:', err);
      if (isProduction) return -1; // Signal failure to fail-closed
    }
  }

  // 3. Fail-closed in production if persistent storage is unavailable
  if (isProduction) {
    const hasConfiguredStore = Boolean(upstashUrl || process.env.FIREBASE_PROJECT_ID);
    if (!hasConfiguredStore) {
      console.error('[Session FATAL] Persistent session store unconfigured in production! Failing closed.');
      return -1;
    }
  }

  return userSessionVersions.get(uid) || 1;
}

export function getUserSessionVersion(uid: string): number {
  return userSessionVersions.get(uid) || 1;
}

export async function revokeUserSessions(uid: string): Promise<number> {
  const current = await getPersistentSessionVersion(uid);
  const nextVersion = Math.max(1, current) + 1;
  userSessionVersions.set(uid, nextVersion);

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      await fetch(`${upstashUrl}/set/session_version:${uid}/${nextVersion}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        signal: AbortSignal.timeout(3000),
      });
    } catch (err) {
      console.warn('[Session] Redis revocation write failed:', err);
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      const { adminDb } = await import('@/lib/firebase/server');
      if (adminDb) {
        await adminDb.collection('session_versions').doc(uid).set({
          uid,
          sessionVersion: nextVersion,
          revokedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('[Session] Firestore revocation write failed:', err);
    }
  }

  return nextVersion;
}

export function getAuthSecret(): Uint8Array {
  const env = process.env.NODE_ENV;
  const secret = process.env.AUTH_SECRET;

  if (env === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'FATAL CONFIG ERROR: AUTH_SECRET must be configured and be at least 32 bytes in production.'
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Use different secret for dev/test
  const activeSecret = secret || process.env.FIREBASE_PRIVATE_KEY || DEV_DEFAULT_SECRET;
  return new TextEncoder().encode(activeSecret);
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
 * Clamps max lifetime to 8 hours (28800 seconds).
 */
export async function createSignedSessionToken(
  payload: {
    uid: string;
    role: UserRole;
    orgId: string;
    lastActive?: number;
    sessionVersion?: number;
  },
  expiresInSeconds: number = 60 * 60 * 8 // 8 hours default
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Enforce max lifetime ceiling of 8 hours (28,800s)
  const clampedLifetime = Math.min(expiresInSeconds, 8 * 60 * 60);
  const resolvedVersion = payload.sessionVersion ?? (await getPersistentSessionVersion(payload.uid));
  const currentVersion = resolvedVersion === -1 ? 1 : resolvedVersion;

  const fullPayload: VerifiedSessionPayload = {
    uid: payload.uid,
    role: payload.role,
    orgId: payload.orgId,
    iss: 'praxis-ai-platform',
    env: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    iat: now,
    exp: now + clampedLifetime,
    lastActive: payload.lastActive ?? now,
    sessionVersion: currentVersion,
  };

  const payloadString = JSON.stringify(fullPayload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadString));

  const key = await crypto.subtle.importKey(
    'raw',
    getAuthSecret() as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64) as unknown as BufferSource
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Cryptographically verifies session token.
 * Returns null if token is malformed, signature is invalid, token is expired,
 * idle timeout is exceeded, or token was revoked.
 */
export async function verifySignedSessionToken(
  token: string | undefined
): Promise<VerifiedSessionPayload | null> {
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
      getAuthSecret() as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlDecode(signatureB64);
    const dataBytes = new TextEncoder().encode(payloadB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    let rawObj: unknown;
    try {
      rawObj = JSON.parse(payloadJson);
    } catch {
      return null;
    }

    const parseResult = SessionPayloadSchema.safeParse(rawObj);
    if (!parseResult.success) {
      return null;
    }

    const payload = parseResult.data;
    const now = Math.floor(Date.now() / 1000);

    // Expiration check
    if (payload.exp <= now) {
      return null; // Expired
    }

    // Maximum lifetime check (8 hours)
    if (payload.exp - payload.iat > 8 * 60 * 60 + 60) {
      return null; // Exceeded 8 hour maximum token lifetime
    }

    // Idle timeout check (15 minutes = 900 seconds)
    if (payload.lastActive && now - payload.lastActive > 15 * 60) {
      return null; // Idle timeout exceeded
    }

    // Revocation check (persistent across processes)
    const currentVersion = await getPersistentSessionVersion(payload.uid);
    if (currentVersion === -1) {
      return null; // Fail closed if persistent store unconfigured or unreachable in production
    }
    if (payload.sessionVersion < currentVersion) {
      return null; // Token was revoked
    }

    // Production environment checks
    if (process.env.NODE_ENV === 'production') {
      if (payload.uid.startsWith('dev_')) {
        return null; // Reject development backdoor uids in production
      }
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Convenience helper to extract and verify the current session cookie from next/headers.
 */
export async function getVerifiedSession(): Promise<VerifiedSessionPayload | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    return await verifySignedSessionToken(token);
  } catch {
    return null;
  }
}

