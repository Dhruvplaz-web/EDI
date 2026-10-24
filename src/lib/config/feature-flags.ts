/**
 * Praxis AI / EDI - Server-Side Per-Organization Feature Flags & Research Mode Gate
 *
 * Grounding:
 * - CDSCO Guidance Document on Medical Device Software (CDSCO/MD/GD/MDSW/01/2026)
 * - ICMR Ethical Guidelines for AI in Biomedical Research and Healthcare (2023)
 * - Telemedicine Practice Guidelines (2020) & Telepsychiatry Operational Guidelines (2020)
 *
 * Default Rule (D2):
 * - All biomarker scores, discrepancy alerts, and AI SOAP drafting are OFF by default.
 * - Enabling Research Mode strictly requires:
 *   1. Ethics Committee approval reference (IEC/IRB).
 *   2. Approval date.
 *   3. Uploaded approval document link.
 *   4. Signed institutional research agreement flag.
 *   5. Super-admin authorization recorded in the immutable audit log.
 *
 * Legal Disclaimer: DESIGNED TO SUPPORT INDIAN REGULATORY GATING — REQUIRES LAWYER & CDSCO CONSULTANT REVIEW.
 */

import { adminDb } from '@/lib/firebase/server';
import { logServerAudit } from '@/lib/telemetry/server-audit-logger';

export interface OrgFeatureFlags {
  biomarkerScores: boolean;
  discrepancyAlerts: boolean;
  aiNoteDrafting: boolean;
  researchMode: boolean;
}

export interface ResearchModeMetadata {
  ethicsApprovalRef: string;
  approvalDate: string; // ISO date string
  approvalDocUrl: string;
  signedResearchAgreement: boolean;
  superAdminApprovedBy: string;
  superAdminApprovedAt: string;
}

export const DEFAULT_ORG_FEATURE_FLAGS: Readonly<OrgFeatureFlags> = {
  biomarkerScores: false,
  discrepancyAlerts: false,
  aiNoteDrafting: false,
  researchMode: false,
};

export class FeatureFlagDisabledError extends Error {
  public readonly code: string;
  public readonly statusCode: number = 403;
  public readonly flag: keyof OrgFeatureFlags;

  constructor(flag: keyof OrgFeatureFlags, message?: string) {
    const defaultMsg = `Feature '${flag}' is disabled for this organization. Biomarkers, discrepancy alerts, and AI drafting require an Institutional Ethics Committee (IEC) approval under Indian CDSCO/ICMR guidelines.`;
    super(message || defaultMsg);
    this.name = 'FeatureFlagDisabledError';
    this.flag = flag;
    this.code = `FEATURE_DISABLED_${flag.toUpperCase()}`;
  }
}

// In-memory cache for fast lookups
interface CachedOrgEntry {
  flags: OrgFeatureFlags;
  metadata?: ResearchModeMetadata;
  expiresAt: number;
}

const flagsCache = new Map<string, CachedOrgEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Retrieves the feature flags for an organization.
 * Fails closed to all-false defaults if the organization record does not exist.
 */
export async function getOrgFeatureFlags(orgId: string): Promise<OrgFeatureFlags> {
  if (!orgId) return { ...DEFAULT_ORG_FEATURE_FLAGS };

  const cached = flagsCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.flags };
  }

  let flags: OrgFeatureFlags = { ...DEFAULT_ORG_FEATURE_FLAGS };
  let metadata: ResearchModeMetadata | undefined;

  try {
    const shouldQueryDb = adminDb && (process.env.NODE_ENV !== 'test' || Boolean(process.env.FIRESTORE_EMULATOR_HOST));
    if (shouldQueryDb) {
      const doc = await adminDb
        .collection('organizations')
        .doc(orgId)
        .collection('settings')
        .doc('featureFlags')
        .get();

      if (doc.exists) {
        const data = doc.data();
        if (data) {
          flags = {
            biomarkerScores: Boolean(data.biomarkerScores),
            discrepancyAlerts: Boolean(data.discrepancyAlerts),
            aiNoteDrafting: Boolean(data.aiNoteDrafting),
            researchMode: Boolean(data.researchMode),
          };
          if (data.researchMetadata) {
            metadata = data.researchMetadata as ResearchModeMetadata;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[FeatureFlags] Failed to fetch flags for ${orgId}, falling back to safe defaults:`, err);
  }

  flagsCache.set(orgId, {
    flags,
    metadata,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return { ...flags };
}

/**
 * Retrieves research mode metadata for an organization, if configured.
 */
export async function getOrgResearchMetadata(orgId: string): Promise<ResearchModeMetadata | null> {
  if (!orgId) return null;
  const cached = flagsCache.get(orgId);
  if (cached && cached.metadata && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  try {
    const shouldQueryDb = adminDb && (process.env.NODE_ENV !== 'test' || Boolean(process.env.FIRESTORE_EMULATOR_HOST));
    if (shouldQueryDb) {
      const doc = await adminDb
        .collection('organizations')
        .doc(orgId)
        .collection('settings')
        .doc('featureFlags')
        .get();
      if (doc.exists) {
        const data = doc.data();
        return (data?.researchMetadata as ResearchModeMetadata) || null;
      }
    }
  } catch {
    // Return null on failure
  }
  return null;
}

/**
 * Updates feature flags for an organization.
 * Turning on researchMode or activating biomarker/AI features requires super-admin role
 * and complete Institutional Ethics Committee approval documentation.
 */
export async function updateOrgFeatureFlags(
  orgId: string,
  newFlags: Partial<OrgFeatureFlags>,
  actor: { uid: string; role: string },
  researchMetaInput?: Partial<ResearchModeMetadata>
): Promise<{ success: boolean; flags: OrgFeatureFlags; error?: string }> {
  if (!orgId) {
    return { success: false, flags: { ...DEFAULT_ORG_FEATURE_FLAGS }, error: 'Missing organization ID' };
  }

  // 1. Role verification: Only super_admin may modify clinical feature flags
  if (actor.role !== 'super_admin') {
    return {
      success: false,
      flags: await getOrgFeatureFlags(orgId),
      error: 'Forbidden: Only super_admin can configure organization clinical feature flags and research mode.',
    };
  }

  const currentFlags = await getOrgFeatureFlags(orgId);
  const currentMeta = await getOrgResearchMetadata(orgId);

  const targetFlags: OrgFeatureFlags = {
    biomarkerScores: newFlags.biomarkerScores ?? currentFlags.biomarkerScores,
    discrepancyAlerts: newFlags.discrepancyAlerts ?? currentFlags.discrepancyAlerts,
    aiNoteDrafting: newFlags.aiNoteDrafting ?? currentFlags.aiNoteDrafting,
    researchMode: newFlags.researchMode ?? currentFlags.researchMode,
  };

  let targetMeta: ResearchModeMetadata | undefined = currentMeta || undefined;

  // 2. Strict validation for enabling researchMode or experimental AI/biomarkers
  const isEnablingResearch = targetFlags.researchMode && !currentFlags.researchMode;
  const anyAdvancedFlagActive = targetFlags.biomarkerScores || targetFlags.discrepancyAlerts || targetFlags.aiNoteDrafting;

  if (targetFlags.researchMode || anyAdvancedFlagActive) {
    const ethicsRef = researchMetaInput?.ethicsApprovalRef || currentMeta?.ethicsApprovalRef;
    const approvalDate = researchMetaInput?.approvalDate || currentMeta?.approvalDate;
    const approvalDoc = researchMetaInput?.approvalDocUrl || currentMeta?.approvalDocUrl;
    const signedAgreement = researchMetaInput?.signedResearchAgreement ?? currentMeta?.signedResearchAgreement;

    if (!ethicsRef || ethicsRef.trim().length < 3) {
      return {
        success: false,
        flags: currentFlags,
        error: 'Ethics Committee approval reference (IEC/IRB) is required to activate research mode or clinical AI.',
      };
    }

    if (!approvalDate || isNaN(Date.parse(approvalDate))) {
      return {
        success: false,
        flags: currentFlags,
        error: 'A valid Institutional Ethics Committee approval date is required.',
      };
    }

    if (!approvalDoc || approvalDoc.trim().length < 5) {
      return {
        success: false,
        flags: currentFlags,
        error: 'An uploaded Institutional Ethics Committee approval document link is required.',
      };
    }

    if (!signedAgreement) {
      return {
        success: false,
        flags: currentFlags,
        error: 'Institutional research agreement must be signed before enabling research mode.',
      };
    }

    targetMeta = {
      ethicsApprovalRef: ethicsRef.trim(),
      approvalDate: new Date(approvalDate).toISOString(),
      approvalDocUrl: approvalDoc.trim(),
      signedResearchAgreement: true,
      superAdminApprovedBy: actor.uid,
      superAdminApprovedAt: new Date().toISOString(),
    };
  } else if (!targetFlags.researchMode) {
    // If research mode is disabled, all sub-flags must be forcibly turned off
    targetFlags.biomarkerScores = false;
    targetFlags.discrepancyAlerts = false;
    targetFlags.aiNoteDrafting = false;
  }

  // 3. Persist to Firestore
  try {
    const shouldQueryDb = adminDb && (process.env.NODE_ENV !== 'test' || Boolean(process.env.FIRESTORE_EMULATOR_HOST));
    if (shouldQueryDb) {
      await adminDb
        .collection('organizations')
        .doc(orgId)
        .collection('settings')
        .doc('featureFlags')
        .set(
          {
            ...targetFlags,
            researchMetadata: targetMeta || null,
            updatedAt: new Date().toISOString(),
            updatedBy: actor.uid,
          },
          { merge: true }
        );
    }
  } catch (err) {
    console.error(`[FeatureFlags] Failed to write flags for ${orgId}:`, err);
  }

  // 4. Update in-memory cache
  flagsCache.set(orgId, {
    flags: targetFlags,
    metadata: targetMeta,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  // 5. Append-only server audit trail
  await logServerAudit({
    actorId: actor.uid,
    actorRole: actor.role,
    orgId,
    action: isEnablingResearch ? 'ENABLE_RESEARCH_MODE' : 'UPDATE_FEATURE_FLAGS',
    details: {
      flags: targetFlags,
      researchMetadata: targetMeta,
    },
  });

  return { success: true, flags: targetFlags };
}

/**
 * Enforces server-side that a specific feature flag is active for the organization.
 * Throws FeatureFlagDisabledError if disabled.
 */
export async function assertFeatureFlagEnabled(
  orgId: string,
  flag: keyof OrgFeatureFlags
): Promise<void> {
  const flags = await getOrgFeatureFlags(orgId);
  if (!flags[flag]) {
    throw new FeatureFlagDisabledError(flag);
  }
}

/**
 * Testing helpers
 */
export function setMockOrgFeatureFlags(
  orgId: string,
  flags: Partial<OrgFeatureFlags>,
  meta?: Partial<ResearchModeMetadata>
): void {
  const current = flagsCache.get(orgId)?.flags || { ...DEFAULT_ORG_FEATURE_FLAGS };
  const fullFlags: OrgFeatureFlags = {
    ...current,
    ...flags,
  };
  const fullMeta: ResearchModeMetadata | undefined = meta
    ? {
        ethicsApprovalRef: meta.ethicsApprovalRef || 'IEC-2026-TEST-99',
        approvalDate: meta.approvalDate || '2026-01-01',
        approvalDocUrl: meta.approvalDocUrl || 'https://storage.india.health/iec/test.pdf',
        signedResearchAgreement: meta.signedResearchAgreement ?? true,
        superAdminApprovedBy: meta.superAdminApprovedBy || 'admin_test',
        superAdminApprovedAt: meta.superAdminApprovedAt || new Date().toISOString(),
      }
    : undefined;

  flagsCache.set(orgId, {
    flags: fullFlags,
    metadata: fullMeta,
    expiresAt: Date.now() + 10 * 60_000,
  });
}

export function clearMockOrgFeatureFlags(): void {
  flagsCache.clear();
}
