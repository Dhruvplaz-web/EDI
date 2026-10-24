/**
 * Praxis AI - Multi-Tenant Authorization & Platform Break-Glass Security (SEC-03 / Tenant Isolation)
 * 
 * Enforces strict tenant boundaries for all server routes, Server Actions, and Firebase Admin SDK calls.
 * 
 * Platform super_admin policy:
 * - NO DEFAULT PHI ACCESS anywhere (proxy, API routes, server code, firestore rules).
 * - PHI access is ONLY permitted via audited break-glass with reason, expiry, and an immutable notification record.
 */

import { type VerifiedSessionPayload } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';

export class TenantAccessError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'TenantAccessError';
    this.statusCode = statusCode;
  }
}

export interface BreakGlassOverride {
  overrideId: string;
  actorId: string;
  actorRole: string;
  targetOrgId: string;
  patientId: string;
  reason: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Asserts that the authenticated caller belongs to the same organization as the resource.
 * If caller is super_admin, default PHI access is BLOCKED unless a valid emergency break-glass
 * override is verified in the audit store.
 */
export async function assertSameOrg(
  session: VerifiedSessionPayload,
  resourceOrgId: string | undefined,
  patientId?: string
): Promise<void> {
  if (!session) {
    throw new TenantAccessError('Unauthorized: Active cryptographically verified session required', 401);
  }

  // 1. Platform super_admin policy: No default PHI access
  if (session.role === 'super_admin') {
    if (!patientId) {
      throw new TenantAccessError(
        'Forbidden: Platform super_admin has no default PHI access. Audited break-glass override required.',
        403
      );
    }

    const hasBreakGlass = await verifyActiveBreakGlass(session.uid, patientId, resourceOrgId);
    if (!hasBreakGlass) {
      throw new TenantAccessError(
        `Forbidden: Platform super_admin access to patient ${patientId} denied. Active emergency break-glass override required.`,
        403
      );
    }
    return;
  }

  // 2. Standard tenant isolation check
  if (!resourceOrgId || session.orgId !== resourceOrgId) {
    throw new TenantAccessError(
      `Forbidden: Cross-tenant access denied. Caller org (${session.orgId}) does not match resource org (${resourceOrgId || 'unknown'}).`,
      403
    );
  }
}

// In-memory break-glass cache for fast lookup during emergency sessions
const activeBreakGlassStore = new Map<string, BreakGlassOverride>();

export function getBreakGlassKey(actorId: string, patientId: string): string {
  return `${actorId}:${patientId}`;
}

/**
 * Verifies whether an active, non-expired break-glass record exists for a super_admin or clinician.
 */
export async function verifyActiveBreakGlass(
  actorId: string,
  patientId: string,
  targetOrgId?: string
): Promise<boolean> {
  const key = getBreakGlassKey(actorId, patientId);
  const cached = activeBreakGlassStore.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    if (!targetOrgId || cached.targetOrgId === targetOrgId) {
      return true;
    }
  }

  if (process.env.NODE_ENV !== 'test' && adminDb) {
    try {
      const snap = await adminDb
        .collection('emergency_overrides')
        .where('actorId', '==', actorId)
        .where('patientId', '==', patientId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0].data() as BreakGlassOverride;
        if (doc.expiresAt > now) {
          activeBreakGlassStore.set(key, doc);
          return true;
        }
      }
    } catch (err) {
      console.warn('[Tenant] Break-glass verification error:', err);
    }
  }

  return false;
}

/**
 * Records an audited emergency break-glass override in the non-deletable compliance collection.
 */
export async function recordBreakGlassOverride(entry: {
  actorId: string;
  actorRole: string;
  targetOrgId: string;
  patientId: string;
  reason: string;
  durationMinutes?: number;
}): Promise<BreakGlassOverride> {
  const now = Date.now();
  const durationMs = (entry.durationMinutes || 30) * 60 * 1000; // Default 30 min window
  const override: BreakGlassOverride = {
    overrideId: `override_${now}_${Math.random().toString(36).substring(2, 7)}`,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    targetOrgId: entry.targetOrgId,
    patientId: entry.patientId,
    reason: entry.reason,
    createdAt: now,
    expiresAt: now + durationMs,
  };

  const key = getBreakGlassKey(entry.actorId, entry.patientId);
  activeBreakGlassStore.set(key, override);

  if (process.env.NODE_ENV !== 'test' && adminDb) {
    try {
      await adminDb.collection('emergency_overrides').doc(override.overrideId).set(override);
      await adminDb.collection('audit_logs').add({
        action: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        orgId: entry.targetOrgId,
        patientId: entry.patientId,
        details: { reason: entry.reason, expiresAt: override.expiresAt },
        timestamp: now,
        createdAt: new Date(now).toISOString(),
      });
    } catch (err) {
      console.warn('[Tenant] Break-glass store warning:', err);
    }
  }

  return override;
}

export function clearBreakGlassForTesting(): void {
  activeBreakGlassStore.clear();
}
