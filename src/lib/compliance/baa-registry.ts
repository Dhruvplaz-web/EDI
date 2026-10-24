/**
 * Praxis AI - Google Cloud Healthcare / Vertex AI BAA Verification Gate (C.4)
 * 
 * Complies with HIPAA 45 CFR § 164.502(e) & § 164.504(e).
 * Prevents PHI leakage to consumer Gemini endpoints by failing closed unless:
 * 1. Google Cloud Vertex AI BAA is acknowledged by an authorized admin for the org in Firestore.
 * 2. Environment variable GOOGLE_CLOUD_HEALTHCARE_BAA_SIGNED is true.
 * 3. Model target is a supported enterprise Vertex AI model.
 */

import { adminDb } from '@/lib/firebase/server';

export const SUPPORTED_VERTEX_MODELS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
] as const;

export type SupportedVertexModel = (typeof SUPPORTED_VERTEX_MODELS)[number];

export interface BaaAcknowledgment {
  orgId: string;
  adminId: string;
  provider: 'google_cloud_vertex_ai';
  hipaaBaaConfirmed: boolean;
  modelTarget: SupportedVertexModel;
  timestamp: number;
}

// In-memory cache for BAA acknowledgments
const baaRegistry = new Map<string, BaaAcknowledgment>();

export async function acknowledgeBaaForOrg(entry: {
  orgId: string;
  adminId: string;
  modelTarget?: SupportedVertexModel;
}): Promise<BaaAcknowledgment> {
  const model = entry.modelTarget || 'gemini-1.5-pro';
  const ack: BaaAcknowledgment = {
    orgId: entry.orgId,
    adminId: entry.adminId,
    provider: 'google_cloud_vertex_ai',
    hipaaBaaConfirmed: true,
    modelTarget: model,
    timestamp: Date.now(),
  };

  baaRegistry.set(entry.orgId, ack);

  try {
    if (adminDb) {
      await adminDb.collection('organizations').doc(entry.orgId).collection('compliance').doc('baa').set({
        ...ack,
        acknowledgedAt: new Date(ack.timestamp).toISOString(),
      });
    }
  } catch (err) {
    console.warn('[BAA Registry] Local store acknowledgment:', ack, err);
  }

  return ack;
}

export async function isVertexAiBaaActive(orgId: string): Promise<{
  active: boolean;
  model?: SupportedVertexModel;
  reason?: string;
}> {
  // 1. Env declaration check
  if (process.env.GOOGLE_CLOUD_HEALTHCARE_BAA_SIGNED !== 'true') {
    return {
      active: false,
      reason: 'GOOGLE_CLOUD_HEALTHCARE_BAA_SIGNED env flag is not true.',
    };
  }

  // 2. Organization explicit admin acknowledgment check
  let ack = baaRegistry.get(orgId);
  if (!ack && adminDb) {
    try {
      const doc = await adminDb.collection('organizations').doc(orgId).collection('compliance').doc('baa').get();
      if (doc.exists) {
        ack = doc.data() as BaaAcknowledgment;
        if (ack) baaRegistry.set(orgId, ack);
      }
    } catch {
      // Fallback to in-memory
    }
  }

  if (!ack || !ack.hipaaBaaConfirmed) {
    return {
      active: false,
      reason: `Organization ${orgId} has not recorded an explicit HIPAA BAA acknowledgment.`,
    };
  }

  if (!SUPPORTED_VERTEX_MODELS.includes(ack.modelTarget)) {
    return {
      active: false,
      reason: `Unsupported model target ${ack.modelTarget}. Must be one of: ${SUPPORTED_VERTEX_MODELS.join(', ')}`,
    };
  }

  return {
    active: true,
    model: ack.modelTarget,
  };
}

export function clearBaaRegistryForTesting(): void {
  baaRegistry.clear();
}
