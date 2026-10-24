import { NextRequest, NextResponse } from 'next/server';
import {
  submitDpdpRequest,
  listDpdpRequestsForOrg,
  listDpdpRequestsForPatient,
  updateDpdpRequestStatus,
  processErasureRequest,
  generateDataExportBundle,
  registerNominee,
  DpdpRequestType,
  DpdpRequestStatus,
  NominatedRepresentative,
} from '@/lib/dpdp/data-principal-rights';
import { validateNoAadhaar } from '@/lib/privacy/masking';
import { getVerifiedSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status') as DpdpRequestStatus | null;

  if (patientId) {
    const list = listDpdpRequestsForPatient(patientId);
    return NextResponse.json({ success: true, requests: list });
  }

  if (orgId) {
    const list = listDpdpRequestsForOrg(orgId, status || undefined);
    return NextResponse.json({ success: true, requests: list });
  }

  return NextResponse.json(
    { error: 'orgId or patientId is required.' },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, orgId, type, details } = body;

    if (!patientId || !orgId || !type) {
      return NextResponse.json(
        { error: 'patientId, orgId, and type are required.' },
        { status: 400 }
      );
    }

    // Zero-Aadhaar Defense Check
    const aadhaarCheck = validateNoAadhaar(body);
    if (!aadhaarCheck.isValid) {
      return NextResponse.json(
        { error: aadhaarCheck.error, code: 'AADHAAR_PROHIBITED' },
        { status: 400 }
      );
    }

    // Special Handling: Right to Access / Machine-readable Data Export
    if (type === 'access_export') {
      const exportBundle = await generateDataExportBundle(patientId, orgId);
      const request = await submitDpdpRequest({
        patientId,
        orgId,
        type: 'access_export',
        details: { exportGenerated: true, ...details },
      });
      return NextResponse.json({
        success: true,
        request,
        exportBundle,
      });
    }

    // Special Handling: Right to Erasure with Statutory Legal Hold Check
    if (type === 'erasure') {
      const erasureResult = await processErasureRequest({ patientId, orgId });
      const request = await submitDpdpRequest({
        patientId,
        orgId,
        type: 'erasure',
        details: { ...details, ...erasureResult },
      });
      return NextResponse.json({
        success: true,
        request,
        erasureResult,
      });
    }

    // Special Handling: Nominated Representative Registration
    if (type === 'nominee') {
      const nominee = await registerNominee({
        patientId,
        orgId,
        nominee: details as NominatedRepresentative,
      });
      const request = await submitDpdpRequest({
        patientId,
        orgId,
        type: 'nominee',
        details: { nomineeRegistered: true, nomineeName: nominee.name },
      });
      return NextResponse.json({
        success: true,
        request,
        nominee,
      });
    }

    // Standard Request (Correction, Grievance)
    const request = await submitDpdpRequest({
      patientId,
      orgId,
      type: type as DpdpRequestType,
      details: details || {},
    });

    return NextResponse.json({ success: true, request });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !['super_admin', 'clinic_manager', 'compliance_officer'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only clinical administrators can update DPDP request status.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, status, resolutionNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'requestId and status are required.' },
        { status: 400 }
      );
    }

    const updated = await updateDpdpRequestStatus({
      requestId,
      actorId: session.uid,
      actorRole: session.role,
      status: status as DpdpRequestStatus,
      resolutionNotes,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
