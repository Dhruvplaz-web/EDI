import { NextRequest, NextResponse } from 'next/server';
import {
  registerPractitioner,
  setPractitionerVerification,
  getPractitionerProfile,
  assertPractitionerCanStartConsult,
  PractitionerType,
} from '@/lib/clinical/practitioner-registry';
import { getVerifiedSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  const checkConsult = searchParams.get('checkConsult') === 'true';

  if (!uid) {
    return NextResponse.json({ error: 'Practitioner uid is required.' }, { status: 400 });
  }

  if (checkConsult) {
    const consultGate = assertPractitionerCanStartConsult(uid);
    if (!consultGate.allowed) {
      return NextResponse.json(
        { error: consultGate.error, code: 'PRACTITIONER_NOT_VERIFIED' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, profile: consultGate.profile });
  }

  const profile = getPractitionerProfile(uid);
  if (!profile) {
    return NextResponse.json({ error: 'Practitioner profile not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !['clinician', 'specialist', 'clinical_director', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized: Clinician authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, practitionerType, qualifications, registrationNumber, medicalCouncil, registrationYear } = body;

    if (!name || !registrationNumber || !medicalCouncil || !registrationYear) {
      return NextResponse.json(
        { error: 'name, registrationNumber, medicalCouncil, and registrationYear are required.' },
        { status: 400 }
      );
    }

    const profile = await registerPractitioner({
      uid: session.uid,
      orgId: session.orgId,
      name,
      email: email || `${session.uid}@clinic.in`,
      practitionerType: (practitionerType as PractitionerType) || 'psychiatrist',
      qualifications: qualifications || ['MBBS', 'MD Psychiatry'],
      registrationNumber,
      medicalCouncil,
      registrationYear: Number(registrationYear),
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !['super_admin', 'clinic_manager', 'clinical_director'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only clinic managers and super admins can verify practitioners.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { practitionerUid, status, rejectionReason } = body;

    if (!practitionerUid || !status) {
      return NextResponse.json(
        { error: 'practitionerUid and status are required.' },
        { status: 400 }
      );
    }

    const updated = await setPractitionerVerification({
      practitionerUid,
      adminUid: session.uid,
      adminRole: session.role,
      status: status as 'verified' | 'rejected',
      rejectionReason,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Practitioner profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
