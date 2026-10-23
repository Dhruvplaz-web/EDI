'use server'

import { adminDb } from '@/lib/firebase/server'
import { cookies } from 'next/headers'
import * as admin from 'firebase-admin'

export async function submitIntake(formData: Record<string, unknown>) {
  try {
    const cookieStore = await cookies()
    // Ideally, we'd verify the session token, but for now we just get the role
    const role = cookieStore.get('user_role')?.value

    if (role !== 'patient') {
      return { success: false, error: 'Unauthorized. Only patients can submit intakes.' }
    }

    // In a real app, you'd get the actual user ID from the verified session token.
    // For this prototype, we'll use a mock patient ID or generate one.
    const patientId = "PT-12345"

    const intakeDoc = {
      patientId,
      symptoms: formData.symptoms,
      severity: formData.severity,
      medicationChanges: formData.medicationChanges,
      bloodPressure: formData.bloodPressure,
      weight: formData.weight,
      // The baseline AI severity score will be calculated by the local model later.
      // For now, we store a placeholder or whatever the client sends if it ran the model.
      baselineSeverityScore: formData.baselineSeverityScore || null,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'waiting'
    }

    await adminDb.collection('intakes').add(intakeDoc)
    
    // Also log this in the audit_logs
    await adminDb.collection('audit_logs').add({
      action: 'intake_submitted',
      actor: patientId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: 'Patient submitted pre-consultation intake form.'
    })

    return { success: true }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Intake submission failed:', errorMsg);
    return { success: false, error: 'Failed to submit intake form.' }
  }
}
