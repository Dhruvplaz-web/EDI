'use server';

import { adminDb } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { DEFAULT_DEMO_ORG_ID } from '@/lib/tenant/context';

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
  orgId: z.string().optional(),
});

export async function submitIntake(formData: Record<string, unknown>) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('user_role')?.value;
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken || role !== 'patient') {
      return { success: false, error: 'Unauthorized. An active patient session is required to submit clinical intake.' };
    }

    // Validate payload with Zod
    const parseResult = intakeFormSchema.safeParse(formData);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid clinical intake data', details: parseResult.error.format() };
    }

    const validData = parseResult.data;

    // Resolve patient identity from session token (or deterministic session id), never a static mock ID
    const sessionUid = cookieStore.get('patient_uid')?.value || 
      `PAT-${sessionToken.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

    const orgId = validData.orgId || cookieStore.get('user_org')?.value || DEFAULT_DEMO_ORG_ID;

    const intakeDoc = {
      patientId: sessionUid,
      orgId,
      symptoms: validData.symptoms,
      baselineSeverityScore: Number(validData.severity || validData.baselineSeverityScore || 5.0),
      medicationChanges: validData.medicationChanges === 'yes' ? 'yes' : 'no',
      au4Frown: Number(validData.au4Frown || 0),
      au15Depressor: Number(validData.au15Depressor || 0),
      speechJitter: Number(validData.speechJitter || 0),
      pitchVariance: Number(validData.pitchVariance || 0),
      phq9Score: Number(validData.phq9Score || 0),
      gad7Score: Number(validData.gad7Score || 0),
      discrepancyD: Number(validData.discrepancyD || 0),
      status: 'waiting',
      isDemo: orgId === DEFAULT_DEMO_ORG_ID,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('intakes').add(intakeDoc);

    // Immutable audit trail entry
    await adminDb.collection('audit_logs').add({
      action: 'clinical_intake_submitted',
      actor: sessionUid,
      orgId,
      intakeId: docRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: 'Patient submitted pre-consultation intake assessment.'
    });

    return { success: true, intakeId: docRef.id };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Intake Action Error]:', errorMsg);
    return { success: false, error: 'Failed to record intake assessment in database.' };
  }
}
