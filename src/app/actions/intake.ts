'use server';

import { adminDb } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { DEFAULT_DEMO_ORG_ID } from '@/lib/tenant/context';
import { verifySignedSessionToken } from '@/lib/auth/session';

const intakeFormSchema = z.object({
  symptoms: z.string().min(3).max(2000),
  severity: z.union([z.number(), z.string()]).optional(),
  medicationChanges: z.string().optional(),
  bloodPressure: z.string().optional(),
  weight: z.string().optional(),
  baselineSeverityScore: z.number().min(0).max(10).optional(),
  au4Frown: z.number().optional(),
  au15Depressor: z.number().optional(),
  speechJitter: z.number().optional(),
  pitchVariance: z.number().optional(),
  phq9Score: z.number().optional(),
  gad7Score: z.number().optional(),
  discrepancyD: z.number().optional(),
  consentGiven: z.boolean().optional(),
});

export async function submitIntake(formData: Record<string, unknown>) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    // Cryptographically verify session token - NEVER trust raw user_role or raw client input
    const verifiedSession = await verifySignedSessionToken(sessionToken);
    if (!verifiedSession || verifiedSession.role !== 'patient') {
      return { 
        success: false, 
        error: 'Unauthorized: A cryptographically verified patient session is required to submit clinical intake.' 
      };
    }

    // Validate payload with Zod
    const parseResult = intakeFormSchema.safeParse(formData);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid clinical intake data', details: parseResult.error.format() };
    }

    const validData = parseResult.data;

    // Derive patientId and orgId strictly from the cryptographically verified session token
    const sessionUid = verifiedSession.uid;
    const orgId = verifiedSession.orgId || DEFAULT_DEMO_ORG_ID;

    // Check organization feature flags for India compliance
    const { getOrgFeatureFlags } = await import('@/lib/config/feature-flags');
    const orgFlags = await getOrgFeatureFlags(orgId);

    const intakeDoc = {
      patientId: sessionUid,
      orgId,
      symptoms: validData.symptoms,
      baselineSeverityScore: Number(validData.severity || validData.baselineSeverityScore || 5.0),
      medicationChanges: validData.medicationChanges === 'yes' ? 'yes' : 'no',
      au4Frown: orgFlags.biomarkerScores ? Number(validData.au4Frown || 0) : 0,
      au15Depressor: orgFlags.biomarkerScores ? Number(validData.au15Depressor || 0) : 0,
      speechJitter: orgFlags.biomarkerScores ? Number(validData.speechJitter || 0) : 0,
      pitchVariance: orgFlags.biomarkerScores ? Number(validData.pitchVariance || 0) : 0,
      phq9Score: Number(validData.phq9Score || 0),
      gad7Score: Number(validData.gad7Score || 0),
      discrepancyD: orgFlags.discrepancyAlerts ? Number(validData.discrepancyD || 0) : 0,
      isResearchCohort: Boolean(orgFlags.researchMode),
      status: 'waiting',
      isDemo: orgId === DEFAULT_DEMO_ORG_ID,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!adminDb) {
      throw new Error('Database service is currently uninitialized');
    }

    const docRef = await adminDb.collection('intakes').add(intakeDoc);

    // Immutable hash-chained audit trail entry
    const { logServerAudit } = await import('@/lib/telemetry/server-audit-logger');
    await logServerAudit({
      action: 'INTAKE_SUBMITTED',
      actorId: sessionUid,
      actorRole: 'patient',
      orgId,
      patientId: sessionUid,
      details: { intakeId: docRef.id, symptomsLength: validData.symptoms.length },
    });

    return { success: true, intakeId: docRef.id };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Intake Action Error]:', errorMsg);
    return { success: false, error: 'Failed to record intake assessment in database.' };
  }
}

export const submitIntakeAction = submitIntake;
