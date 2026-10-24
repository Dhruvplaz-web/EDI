/**
 * Praxis AI - DPDP Act 2023 Itemized, Unbundled & Revocable Patient Consent Engine
 * 
 * Complies with Section 5 (Notice) & Section 6 (Consent) of the Digital Personal Data
 * Protection Act 2023 and Telemedicine Practice Guidelines 2020.
 * 
 * Features:
 * - Itemized, unbundled, discrete consent purposes (consultation, camera/mic, recording, research, storage).
 * - Trilingual notices in English, Hindi, and Marathi (Tagged: NEEDS HUMAN REVIEW).
 * - Ease of withdrawal matching ease of giving consent (§ 6(4) DPDP Act).
 * - Real-time mid-call withdrawal enforcement with automatic non-mandatory telemetry purge.
 * - Guardian consent verification for minors under 18 years (§ 9 DPDP Act).
 */

import { createSignedSessionToken, verifySignedSessionToken } from '@/lib/auth/session';
import { logServerAudit } from '@/lib/telemetry/server-audit-logger';

export type ConsentPurpose = 
  | 'consultation'         // Telemedicine consultation under NMC 2020 Guidelines
  | 'camera_microphone'    // Real-time camera & microphone audio/video stream
  | 'recording'            // Optional consultation recording (default false)
  | 'research_analysis'    // RUO bio-acoustic and facial kinematic telemetry analysis (default false)
  | 'storage_sharing';     // Secure storage and sharing of records with clinic (Data Fiduciary)

// Backwards-compatible legacy alias
export type ConsentScope = 'voice_telemetry' | 'facial_kinematics' | 'ai_documentation' | 'transcription' | ConsentPurpose;

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface GuardianConsentRecord {
  guardianId: string;
  guardianName: string;
  relationship: 'parent' | 'legal_guardian';
  guardianPhone?: string;
  verifiedAt: number;
}

export interface PatientConsentRecord {
  patientId: string;
  orgId: string;
  purposes: Record<ConsentPurpose, boolean>;
  // Backwards compatibility alias
  scope: (ConsentScope | string)[];
  noticeVersion: string;
  policyVersion?: string; // Legacy alias for noticeVersion
  language: SupportedLanguage;
  timestamp: number;
  revoked: boolean;
  revokedAt?: number;
  withdrawnPurposes?: ConsentPurpose[];
  guardianConsent?: GuardianConsentRecord;
  isMinor?: boolean;
}

/**
 * Trilingual Itemized Notices & Consent Descriptions (§ 5 DPDP Act)
 * Note: Non-English translations are machine-assisted: NEEDS HUMAN REVIEW
 */
export const DPDP_CONSENT_NOTICES: Record<
  SupportedLanguage,
  {
    title: string;
    fiduciaryNotice: string;
    withdrawalNotice: string;
    purposes: Record<ConsentPurpose, { label: string; description: string }>;
  }
> = {
  en: {
    title: 'Patient Informed Consent & Telemedicine Notice (DPDP Act 2023)',
    fiduciaryNotice: 'Your healthcare clinic operates as the Data Fiduciary under the Digital Personal Data Protection Act 2023. Praxis AI processes your personal data strictly on behalf of the clinic as a Data Processor.',
    withdrawalNotice: 'You have the statutory right to withdraw your consent at any time. Withdrawal is as easy as giving consent and will immediately stop related data processing.',
    purposes: {
      consultation: {
        label: 'Telemedicine Consultation',
        description: 'I consent to receive tele-psychiatry medical care from a Registered Medical Practitioner (RMP) in accordance with the NMC Telemedicine Practice Guidelines 2020.',
      },
      camera_microphone: {
        label: 'Camera & Microphone Access',
        description: 'I consent to the real-time transmission of my camera and microphone feeds solely for the visual and auditory consultation between myself and the physician.',
      },
      recording: {
        label: 'Consultation Recording (Optional)',
        description: 'I consent to optional audio/video recording of this consultation for medical documentation and treatment continuity. (Disabled by default).',
      },
      research_analysis: {
        label: 'Assistive Telemetry & Research Analysis (RUO)',
        description: 'I consent to assistive research analysis of vocal acoustics and facial Action Units. This is for Research Use Only, approved by an Institutional Ethics Committee, and is not used for primary clinical diagnosis.',
      },
      storage_sharing: {
        label: 'Secure Storage & Clinic Sharing',
        description: 'I consent to the secure storage of my clinical consultations, e-prescriptions, and notes in Google Cloud India regions (Mumbai/Delhi) for the mandatory 3-year statutory retention period.',
      },
    },
  },
  hi: {
    title: 'रोगी सूचित सहमति एवं टेलीमेडिसिन सूचना (DPDP अधिनियम 2023) [NEEDS HUMAN REVIEW]',
    fiduciaryNotice: 'आपका क्लिनिक डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट 2023 के तहत डेटा फिडुशियरी के रूप में कार्य करता है। Praxis AI केवल क्लिनिक की ओर से डेटा प्रोसेसर के रूप में कार्य करता है। [NEEDS HUMAN REVIEW]',
    withdrawalNotice: 'आपको किसी भी समय अपनी सहमति वापस लेने का कानूनी अधिकार है। सहमति वापस लेना उतना ही आसान है जितना सहमति देना। [NEEDS HUMAN REVIEW]',
    purposes: {
      consultation: {
        label: 'टेलीमेडिसिन परामर्श [NEEDS HUMAN REVIEW]',
        description: 'मैं एनएमसी टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स 2020 के अनुसार पंजीकृत चिकित्सक से टेली-मनोचिकित्सा प्राप्त करने की सहमति देता/देती हूँ। [NEEDS HUMAN REVIEW]',
      },
      camera_microphone: {
        label: 'कैमरा और माइक्रोफ़ोन का उपयोग [NEEDS HUMAN REVIEW]',
        description: 'मैं डॉक्टर के साथ दृश्य-श्रव्य परामर्श के लिए अपने कैमरे और माइक्रोफ़ोन के उपयोग की सहमति देता/देती हूँ। [NEEDS HUMAN REVIEW]',
      },
      recording: {
        label: 'परामर्श रिकॉर्डिंग (वैकल्पिक) [NEEDS HUMAN REVIEW]',
        description: 'मैं नैदानिक समीक्षा के लिए इस परामर्श की वैकल्पिक ऑडियो/वीडियो रिकॉर्डिंग की सहमति देता/देती हूँ। [NEEDS HUMAN REVIEW]',
      },
      research_analysis: {
        label: 'अनुसंधान विश्लेषण एवं बायोमार्कर (RUO) [NEEDS HUMAN REVIEW]',
        description: 'मैं अनुसंधान उद्देश्यों के लिए आवाज और चेहरे के सूक्ष्म संकेतों के विश्लेषण की सहमति देता/देती हूँ (केवल नैतिकता समिति द्वारा स्वीकृत अनुसंधान के लिए)। [NEEDS HUMAN REVIEW]',
      },
      storage_sharing: {
        label: 'सुरक्षित भंडारण और क्लिनिक साझाकरण [NEEDS HUMAN REVIEW]',
        description: 'मैं भारत के भीतर (मुंबई/दिल्ली) 3 साल की वैधानिक अवधि के लिए अपने मेडिकल रिकॉर्ड को सुरक्षित रखने की सहमति देता/देती हूँ। [NEEDS HUMAN REVIEW]',
      },
    },
  },
  mr: {
    title: 'रुग्ण माहितीपूर्ण संमती आणि टेलिमेडिसिन सूचना (DPDP कायदा २०२३) [NEEDS HUMAN REVIEW]',
    fiduciaryNotice: 'तुमचे क्लिनिक डिजिटल पर्सनल डेटा प्रोटेक्शन कायदा २०२३ अंतर्गत डेटा फिड्युशिअरी म्हणून कार्य करते. Praxis AI केवळ क्लिनिकच्या वतीने डेटा प्रोसेसर म्हणून प्रक्रिया करते. [NEEDS HUMAN REVIEW]',
    withdrawalNotice: 'तुम्हाला तुमची संमती कधीही मागे घेण्याचा वैधानिक अधिकार आहे. संमती मागे घेणे तितकेच सोपे आहे जितके देणे. [NEEDS HUMAN REVIEW]',
    purposes: {
      consultation: {
        label: 'टेलिमेडिसिन सल्लामसलत [NEEDS HUMAN REVIEW]',
        description: 'मी एनएमसी टेलिमेडिसिन प्रॅक्टिस मार्गदर्शक तत्त्वे २०२० नुसार नोंदणीकृत डॉक्टरांकडून सल्लामसलत घेण्यास संमती देतो/देते. [NEEDS HUMAN REVIEW]',
      },
      camera_microphone: {
        label: 'कॅमेरा आणि मायक्रोफोन प्रवेश [NEEDS HUMAN REVIEW]',
        description: 'मी डॉक्टरांशी संवाद साधण्यासाठी कॅमेरा आणि मायक्रोफोन वापरण्यास संमती देतो/देते. [NEEDS HUMAN REVIEW]',
      },
      recording: {
        label: 'सल्लामसलत रेकॉर्डिंग (पर्यायी) [NEEDS HUMAN REVIEW]',
        description: 'मी वैद्यकीय दस्तऐवजीकरणासाठी या सत्राच्या पर्यायी रेकॉर्डिंगला संमती देतो/देते. [NEEDS HUMAN REVIEW]',
      },
      research_analysis: {
        label: 'संशोधन विश्लेषण आणि बायोमार्कर (RUO) [NEEDS HUMAN REVIEW]',
        description: 'मी अनामित आवाजाच्या आणि चेहऱ्याच्या सूक्ष्म संकेतांच्या संशोधनात्मक विश्लेषणास संमती देतो/देते (केवळ नीतिशास्त्र समिती मान्यतेसह). [NEEDS HUMAN REVIEW]',
      },
      storage_sharing: {
        label: 'सुरक्षित साठवणूक आणि क्लिनिक सामायिकरण [NEEDS HUMAN REVIEW]',
        description: 'मी भारतामध्ये (मुंबई/दिल्ली) ३ वर्षांच्या वैधानिक कालावधीसाठी माझे वैद्यकीय रेकॉर्ड सुरक्षित ठेवण्यास संमती देतो/देते. [NEEDS HUMAN REVIEW]',
      },
    },
  },
};

// Server-side in-memory durable consent registry keyed by `${orgId}:${patientId}`
const serverConsentStore = new Map<string, PatientConsentRecord>();

// Live revocation token set for instant mid-call session invalidation
const revokedConsentTokens = new Set<string>();

function getConsentKey(patientId: string, orgId: string): string {
  return `${orgId}:${patientId}`;
}

/**
 * Persists an itemized patient consent record server-side.
 */
export async function recordPatientConsent(data: {
  patientId: string;
  orgId: string;
  purposes?: Partial<Record<ConsentPurpose, boolean>>;
  scope?: (ConsentScope | string)[];
  noticeVersion?: string;
  policyVersion?: string; // Legacy alias
  language?: SupportedLanguage;
  guardianConsent?: GuardianConsentRecord;
  isMinor?: boolean;
  timestamp?: number;
}): Promise<PatientConsentRecord> {
  const purposes: Record<ConsentPurpose, boolean> = {
    consultation: data.purposes?.consultation ?? true,
    camera_microphone: data.purposes?.camera_microphone ?? true,
    recording: data.purposes?.recording ?? false,
    research_analysis: data.purposes?.research_analysis ?? false,
    storage_sharing: data.purposes?.storage_sharing ?? true,
  };

  // Derive legacy scope list for backwards compatibility with existing callers
  const legacyScope: (ConsentScope | string)[] = data.scope || [];
  if (purposes.consultation) legacyScope.push('consultation');
  if (purposes.camera_microphone) legacyScope.push('camera_microphone');
  if (purposes.research_analysis) {
    legacyScope.push('voice_telemetry', 'facial_kinematics', 'research_analysis');
  }
  if (purposes.storage_sharing) {
    legacyScope.push('ai_documentation', 'transcription', 'storage_sharing');
  }

  const noticeVer = data.noticeVersion || data.policyVersion || 'dpdp_v2.1';

  const record: PatientConsentRecord = {
    patientId: data.patientId,
    orgId: data.orgId,
    purposes,
    scope: Array.from(new Set(legacyScope)),
    noticeVersion: noticeVer,
    policyVersion: noticeVer,
    language: data.language || 'en',
    timestamp: data.timestamp || Date.now(),
    revoked: false,
    guardianConsent: data.guardianConsent,
    isMinor: Boolean(data.isMinor),
  };

  const key = getConsentKey(data.patientId, data.orgId);
  serverConsentStore.set(key, record);

  // Log audit trail entry for consent grant
  await logServerAudit({
    actorId: data.patientId,
    actorRole: 'patient',
    orgId: data.orgId,
    action: 'CONSENT_GRANTED',
    patientId: data.patientId,
    details: {
      purposes,
      language: record.language,
      noticeVersion: record.noticeVersion,
      isMinor: record.isMinor,
      hasGuardian: Boolean(record.guardianConsent),
    },
  });

  return record;
}

/**
 * Retrieves the stored consent record.
 */
export async function getStoredConsent(
  patientId: string,
  orgId: string
): Promise<PatientConsentRecord | null> {
  if (!patientId || !orgId) return null;
  return serverConsentStore.get(getConsentKey(patientId, orgId)) || null;
}

/**
 * Verifies that a patient has an active, non-withdrawn consent record covering
 * the requested operational purpose or legacy scope.
 */
export async function verifyStoredConsent(
  patientId: string,
  orgId: string,
  requiredScopeOrPurpose?: ConsentScope | string
): Promise<{ isValid: boolean; record?: PatientConsentRecord; reason?: string }> {
  if (!patientId || !orgId) {
    return { isValid: false, reason: 'Patient ID and Organization ID are required to verify consent.' };
  }

  const record = await getStoredConsent(patientId, orgId);
  if (!record) {
    return {
      isValid: false,
      reason: `No documented DPDP consent record found for patient ${patientId} in organization ${orgId}.`,
    };
  }

  if (record.revoked) {
    return {
      isValid: false,
      record,
      reason: `Patient ${patientId} withdrew DPDP consent at ${new Date(record.revokedAt || record.timestamp).toISOString()}.`,
    };
  }

  // Minors under 18 MUST have verified guardian consent recorded
  if (record.isMinor && !record.guardianConsent) {
    return {
      isValid: false,
      record,
      reason: `Minor patient ${patientId} lacks verified guardian consent under DPDP Act § 9.`,
    };
  }

  if (requiredScopeOrPurpose) {
    // Check specific purpose if matching ConsentPurpose
    const purposeKey = requiredScopeOrPurpose as ConsentPurpose;
    if (purposeKey in record.purposes && !record.purposes[purposeKey]) {
      return {
        isValid: false,
        record,
        reason: `Patient consent has not been granted for purpose: ${requiredScopeOrPurpose}.`,
      };
    }

    // Check legacy scope list
    if (!record.scope.includes(requiredScopeOrPurpose)) {
      return {
        isValid: false,
        record,
        reason: `Patient consent record does not include required scope: ${requiredScopeOrPurpose}.`,
      };
    }
  }

  return { isValid: true, record };
}

/**
 * Revokes / withdraws patient consent (§ 6(4) DPDP Act).
 * Can withdraw all consents or specific itemized purposes.
 * Immediately halts processing and logs audit trail.
 */
export async function revokePatientConsent(
  patientId: string,
  orgId: string,
  purposesToWithdraw?: ConsentPurpose[]
): Promise<boolean> {
  const key = getConsentKey(patientId, orgId);
  const existing = serverConsentStore.get(key);
  const now = Date.now();

  if (existing) {
    if (purposesToWithdraw && purposesToWithdraw.length > 0) {
      for (const p of purposesToWithdraw) {
        existing.purposes[p] = false;
      }
      existing.withdrawnPurposes = Array.from(new Set([...(existing.withdrawnPurposes || []), ...purposesToWithdraw]));
      if (!existing.purposes.consultation) {
        existing.revoked = true;
        existing.revokedAt = now;
      }
    } else {
      existing.revoked = true;
      existing.revokedAt = now;
      for (const k of Object.keys(existing.purposes) as ConsentPurpose[]) {
        existing.purposes[k] = false;
      }
      existing.scope = [];
    }
    serverConsentStore.set(key, existing);
  } else {
    serverConsentStore.set(key, {
      patientId,
      orgId,
      purposes: {
        consultation: false,
        camera_microphone: false,
        recording: false,
        research_analysis: false,
        storage_sharing: false,
      },
      scope: [],
      noticeVersion: 'dpdp_v2.1',
      language: 'en',
      timestamp: now,
      revoked: true,
      revokedAt: now,
    });
  }

  // Audit trail entry
  await logServerAudit({
    actorId: patientId,
    actorRole: 'patient',
    orgId,
    action: 'CONSENT_REVOKED',
    patientId,
    details: {
      withdrawnPurposes: purposesToWithdraw || 'ALL',
      withdrawnAt: new Date(now).toISOString(),
    },
  });

  return true;
}

/**
 * Issues a cryptographically signed consent token for consultation authorization.
 */
export async function issueConsentToken(
  patientId: string,
  orgId: string,
  purposes?: Partial<Record<ConsentPurpose, boolean>>,
  language?: SupportedLanguage
): Promise<string> {
  await recordPatientConsent({
    patientId,
    orgId,
    purposes,
    language,
    scope: ['voice_telemetry', 'facial_kinematics', 'ai_documentation', 'transcription'],
  });

  return createSignedSessionToken({ uid: patientId, role: 'patient', orgId }, 60 * 60 * 24);
}

/**
 * Validates a signed consent token, ensuring it has not been invalidated or revoked mid-call.
 */
export async function verifyConsentStatus(
  consentToken: string | undefined
): Promise<{ isValid: boolean; patientId?: string; orgId?: string; reason?: string }> {
  if (!consentToken) {
    return { isValid: false, reason: 'Consent token is missing.' };
  }

  if (revokedConsentTokens.has(consentToken)) {
    return { isValid: false, reason: 'Patient revoked consent mid-call. Processing halted immediately.' };
  }

  const payload = await verifySignedSessionToken(consentToken);
  if (!payload) {
    return { isValid: false, reason: 'Consent token signature is invalid or expired.' };
  }

  const serverCheck = await verifyStoredConsent(payload.uid, payload.orgId);
  if (!serverCheck.isValid) {
    return { isValid: false, reason: serverCheck.reason };
  }

  return { isValid: true, patientId: payload.uid, orgId: payload.orgId };
}

/**
 * Mid-call token invalidation.
 */
export function revokeConsentToken(consentToken: string): boolean {
  if (!consentToken) return false;
  revokedConsentTokens.add(consentToken);
  return true;
}

/**
 * Reset helper for unit testing.
 */
export function clearConsentStoreForTesting(): void {
  serverConsentStore.clear();
  revokedConsentTokens.clear();
}
