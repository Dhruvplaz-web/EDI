/**
 * Praxis AI - Registered Medical Practitioner (RMP) & Telemedicine Verification Engine
 * 
 * Implements strict compliance with:
 * 1. NMC Telemedicine Practice Guidelines 2020:
 *    - Clinician must be a Registered Medical Practitioner (RMP) enrolled in the National Medical Register
 *      or a State Medical Council.
 *    - Display name, qualification, and registration number prominently to patients.
 *    - Unverified practitioners CANNOT start consultations (server-enforced).
 * 2. Rehabilitation Council of India (RCI) Rules for Clinical Psychologists:
 *    - Clinical psychologists register under RCI (CRR Number).
 *    - They CANNOT prescribe medications (hard server-side gate).
 * 3. Official Registry Lookup Links (NMC & RCI).
 */

import { logServerAudit } from '@/lib/telemetry/server-audit-logger';

export type PractitionerType = 'psychiatrist' | 'general_rmp' | 'clinical_psychologist';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PractitionerProfile {
  uid: string;
  orgId: string;
  name: string;
  email: string;
  practitionerType: PractitionerType;
  qualifications: string[]; // e.g. ["MBBS", "MD Psychiatry"] or ["M.Phil Clinical Psychology"]
  registrationNumber: string; // e.g. "MMC 84920/2018" or "CRR A12345"
  medicalCouncil: string; // e.g. "Maharashtra Medical Council" or "National Medical Commission" or "Rehabilitation Council of India"
  registrationYear: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: number;
  verifiedBy?: string;
  rejectionReason?: string;
  officialRegistryLookupUrl: string;
}

// In-memory durable registry for fast unit testing & server lookup
const practitionerStore = new Map<string, PractitionerProfile>();

/**
 * Returns the official verification lookup URL for the specified council.
 */
export function getOfficialRegistryUrl(council: string, regNumber: string): string {
  const lower = council.toLowerCase();
  if (lower.includes('rehabilitation') || lower.includes('rci')) {
    return 'https://rehabcouncil.nic.in/';
  }
  // Default to NMC National Medical Register search
  return `https://www.nmc.org.in/information-desk/indian-medical-register/?reg_no=${encodeURIComponent(regNumber)}`;
}

/**
 * Registers or updates a practitioner's professional credentials.
 */
export async function registerPractitioner(params: {
  uid: string;
  orgId: string;
  name: string;
  email: string;
  practitionerType: PractitionerType;
  qualifications: string[];
  registrationNumber: string;
  medicalCouncil: string;
  registrationYear: number;
}): Promise<PractitionerProfile> {
  const lookupUrl = getOfficialRegistryUrl(params.medicalCouncil, params.registrationNumber);

  const profile: PractitionerProfile = {
    ...params,
    verificationStatus: 'pending',
    officialRegistryLookupUrl: lookupUrl,
  };

  practitionerStore.set(params.uid, profile);

  await logServerAudit({
    actorId: params.uid,
    actorRole: 'clinician',
    orgId: params.orgId,
    action: 'RECORD_VIEWED',
    details: {
      actionType: 'PRACTITIONER_REGISTERED',
      registrationNumber: params.registrationNumber,
      medicalCouncil: params.medicalCouncil,
      status: 'pending',
    },
  });

  return profile;
}

/**
 * Admin workflow to verify or reject a practitioner after reviewing credentials
 * against the official NMC/SMC or RCI registry.
 */
export async function setPractitionerVerification(params: {
  practitionerUid: string;
  adminUid: string;
  adminRole: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}): Promise<PractitionerProfile | null> {
  const profile = practitionerStore.get(params.practitionerUid);
  if (!profile) return null;

  profile.verificationStatus = params.status;
  if (params.status === 'verified') {
    profile.verifiedAt = Date.now();
    profile.verifiedBy = params.adminUid;
    profile.rejectionReason = undefined;
  } else {
    profile.rejectionReason = params.rejectionReason || 'Credentials could not be verified in the medical register.';
  }

  practitionerStore.set(params.practitionerUid, profile);

  await logServerAudit({
    actorId: params.adminUid,
    actorRole: params.adminRole,
    orgId: profile.orgId,
    action: 'RECORD_VIEWED',
    details: {
      actionType: 'PRACTITIONER_VERIFICATION_UPDATED',
      practitionerUid: params.practitionerUid,
      newStatus: params.status,
      rejectionReason: profile.rejectionReason,
    },
  });

  return profile;
}

/**
 * Retrieves a practitioner profile by UID.
 */
export function getPractitionerProfile(uid: string): PractitionerProfile | null {
  return practitionerStore.get(uid) || null;
}

/**
 * Server-side gate: Asserts whether a practitioner is verified and authorized
 * to initiate a tele-consultation under NMC Guidelines 2020.
 */
export function assertPractitionerCanStartConsult(uid: string): {
  allowed: boolean;
  profile?: PractitionerProfile;
  error?: string;
} {
  const profile = practitionerStore.get(uid);

  // If not found in memory, allow in local test if mock exists, otherwise fail closed
  if (!profile) {
    return {
      allowed: false,
      error: 'PRACTITIONER_PROFILE_NOT_FOUND: Professional registration profile is missing.',
    };
  }

  if (profile.verificationStatus !== 'verified') {
    return {
      allowed: false,
      profile,
      error: `PRACTITIONER_NOT_VERIFIED: Telemedicine consult cannot be started. Practitioner registration (${profile.registrationNumber}) is currently ${profile.verificationStatus}. Must be verified by clinic administrator.`,
    };
  }

  return { allowed: true, profile };
}

/**
 * Server-side gate: Asserts whether a practitioner is legally authorized to issue
 * medical prescriptions under NMC Guidelines.
 * Clinical psychologists are strictly prohibited from prescribing.
 */
export function assertPractitionerCanPrescribe(uid: string): {
  allowed: boolean;
  profile?: PractitionerProfile;
  error?: string;
} {
  const consultCheck = assertPractitionerCanStartConsult(uid);
  if (!consultCheck.allowed || !consultCheck.profile) {
    return { allowed: false, error: consultCheck.error };
  }

  const profile = consultCheck.profile;

  // Hard statutory ban on prescribing by clinical psychologists
  if (profile.practitionerType === 'clinical_psychologist') {
    return {
      allowed: false,
      profile,
      error: 'PRESCRIPTION_UNAUTHORIZED_FOR_PSYCHOLOGISTS: Under Indian Telemedicine Practice Guidelines 2020 (NMC/MoHFW) and Medical Council Regulations, only Registered Medical Practitioners (RMPs) may issue prescriptions. Clinical psychologists are not permitted to prescribe.',
    };
  }

  return { allowed: true, profile };
}

/**
 * Reset test helper.
 */
export function clearPractitionerStoreForTesting(): void {
  practitionerStore.clear();
}
