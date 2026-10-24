/**
 * Praxis AI - Automated Clinical Telemetry Retention & HIPAA Expiration Engine (Part G.3)
 * 
 * =========================================================================================
 * CRITICAL REGULATORY NOTICE & COMPLIANCE POLICY:
 * Clinical records (SOAP notes, diagnostic evaluations, intake assessments, patient charts)
 * MUST NEVER BE AUTO-DELETED based on SaaS commercial pricing tiers.
 * 
 * Medical record retention is governed strictly by state medical board statutes (typically 7-10 years)
 * and HIPAA rules (45 CFR § 164.316(b)(2)(i), requiring a 6-year retention baseline for compliance actions).
 * Clinical records are subject to an immutable, counsel-configured retention schedule.
 * 
 * This automated engine purges ONLY transient telemetry and derived biomarker data:
 * - High-frequency facial landmark meshes
 * - Pitch/jitter micro-telemetry streams
 * - EMA objective stress sensor readings
 * 
 * Telemetry Retention Windows:
 * - Starter: 30 days
 * - Professional: 365 days (1 year)
 * - Enterprise: 2555 days (7 years)
 * =========================================================================================
 */

import { PlanTier, SAAS_PLANS } from '@/lib/stripe/plans';
import { adminDb } from '@/lib/firebase/server';
import { logServerAudit } from '@/lib/telemetry/server-audit-logger';

export function calculateRetentionCutoff(tier: PlanTier, referenceTime: number = Date.now()): number {
  const plan = SAAS_PLANS[tier] || SAAS_PLANS.starter;
  const days = plan.entitlements.telemetryHistoryDays || 30;
  return referenceTime - days * 24 * 60 * 60 * 1000;
}

export interface PurgeResult {
  orgId: string;
  tier: PlanTier;
  cutoffTimestamp: number;
  purgedRecordsCount: number;
  status: 'completed' | 'dry_run';
  executedAt: number;
}

/**
 * Purges expired transient telemetry streams for an organization.
 * Strictly scopes queries to the 'telemetry' collection.
 * NEVER deletes from 'patients', 'intakes', 'sessions', or 'audit_logs'.
 */
export async function purgeExpiredTelemetry(
  orgId: string,
  tier: PlanTier,
  dryRun: boolean = false
): Promise<PurgeResult> {
  const cutoff = calculateRetentionCutoff(tier);
  let purgedCount = 0;
  const now = Date.now();

  if (process.env.NODE_ENV !== 'test' && adminDb) {
    try {
      const snapshot = await adminDb
        .collection('telemetry')
        .where('orgId', '==', orgId)
        .where('timestamp', '<', cutoff)
        .limit(500)
        .get();

      if (!dryRun && !snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          purgedCount++;
        });
        await batch.commit();

        // Record immutable audit entry
        await logServerAudit({
          action: 'TELEMETRY_RETENTION_PURGE',
          actorId: 'system_retention_scheduler',
          actorRole: 'system',
          orgId,
          details: {
            tier,
            purgedCount,
            cutoffTimestamp: cutoff,
            targetCollection: 'telemetry (biomarkers only)',
          },
        });
      } else {
        purgedCount = snapshot.size;
      }
    } catch (err) {
      console.warn('[Retention Engine] Purge execution error:', err);
    }
  }

  return {
    orgId,
    tier,
    cutoffTimestamp: cutoff,
    purgedRecordsCount: purgedCount,
    status: dryRun ? 'dry_run' : 'completed',
    executedAt: now,
  };
}
