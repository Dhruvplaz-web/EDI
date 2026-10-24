import { NextRequest, NextResponse } from 'next/server';
import { 
  recordPatientConsent, 
  revokePatientConsent, 
  getStoredConsent, 
  ConsentPurpose,
  SupportedLanguage 
} from '@/lib/consent/consent-store';
import { validateNoAadhaar } from '@/lib/privacy/masking';
import { canMinorParticipateInConsult } from '@/lib/dpdp/guardian-consent';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const orgId = searchParams.get('orgId');

  if (!patientId || !orgId) {
    return NextResponse.json(
      { error: 'Missing patientId or orgId query parameters.' },
      { status: 400 }
    );
  }

  const record = await getStoredConsent(patientId, orgId);
  return NextResponse.json({ success: true, consent: record });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, orgId, purposes, language, guardianConsent, isMinor } = body;

    if (!patientId || !orgId) {
      return NextResponse.json(
        { error: 'patientId and orgId are required.' },
        { status: 400 }
      );
    }

    // Data Minimization Check: Prohibit Aadhaar numbers in any input payload
    const aadhaarCheck = validateNoAadhaar(body);
    if (!aadhaarCheck.isValid) {
      return NextResponse.json(
        { error: aadhaarCheck.error, code: 'AADHAAR_PROHIBITED' },
        { status: 400 }
      );
    }

    // Minor Protection Check: Verify guardian consent under DPDP § 9
    if (isMinor) {
      const minorCheck = canMinorParticipateInConsult({
        isMinor: true,
        hasVerifiedGuardian: Boolean(guardianConsent?.guardianId),
        guardianConsentActive: Boolean(guardianConsent?.verifiedAt),
      });

      if (!minorCheck.allowed) {
        return NextResponse.json(
          { error: minorCheck.reason, code: 'GUARDIAN_CONSENT_REQUIRED' },
          { status: 403 }
        );
      }
    }

    // Persist itemized consent
    const record = await recordPatientConsent({
      patientId,
      orgId,
      purposes,
      language: language as SupportedLanguage,
      guardianConsent,
      isMinor: Boolean(isMinor),
    });

    return NextResponse.json({ success: true, consent: record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, orgId, purposesToWithdraw } = body;

    if (!patientId || !orgId) {
      return NextResponse.json(
        { error: 'patientId and orgId are required.' },
        { status: 400 }
      );
    }

    await revokePatientConsent(
      patientId, 
      orgId, 
      purposesToWithdraw as ConsentPurpose[] | undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Consent successfully withdrawn under DPDP Act § 6(4). Processing halted immediately.',
      withdrawnAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
