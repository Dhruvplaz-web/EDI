import { NextRequest, NextResponse } from 'next/server';
import { 
  createEPrescription, 
  generatePrescriptionHtml, 
  ConsultMode, 
  ConsultType, 
  PrescriptionItem 
} from '@/lib/clinical/prescription-engine';
import { getVerifiedSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !['clinician', 'specialist', 'clinical_director', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized: Clinician authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      consultationId, 
      consultMode, 
      consultType, 
      patient, 
      diagnosisNotes, 
      medications, 
      followUpAdvice,
      clinicInfo 
    } = body;

    if (!consultationId || !patient || !diagnosisNotes || !medications) {
      return NextResponse.json(
        { error: 'consultationId, patient, diagnosisNotes, and medications are required.' },
        { status: 400 }
      );
    }

    const rx = await createEPrescription({
      practitionerUid: session.uid,
      consultationId,
      orgId: session.orgId,
      consultMode: (consultMode as ConsultMode) || 'video',
      consultType: (consultType as ConsultType) || 'first_consultation',
      patient,
      diagnosisNotes,
      medications: medications as PrescriptionItem[],
      followUpAdvice,
      clinicInfo,
    });

    const html = generatePrescriptionHtml(rx);

    return NextResponse.json({
      success: true,
      prescription: rx,
      printableHtml: html,
      statutoryTag: 'REQUIRES LAWYER REVIEW • REQUIRES DOCTOR REVIEW',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('UNAUTHORIZED_FOR_PSYCHOLOGISTS') || message.includes('PROHIBITED')
      ? 403
      : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
