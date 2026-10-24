/**
 * Praxis AI - Children & Minor Data Protection (§ 9 DPDP Act 2023 & Default D7)
 * 
 * Enforces:
 * 1. Date of Birth (DOB) capture and age verification.
 * 2. Mandatory verifiable guardian consent for individuals under 18 years of age.
 * 3. Strict permanent disabling of all behavioral monitoring, facial micro-kinematics,
 *    vocal jitter analytics, and predictive discrepancy scoring for minors (§ 9(3) DPDP Act & D7).
 * 4. Trilingual statutory minor protection notices.
 */

import { SupportedLanguage } from '@/lib/consent/consent-store';

export interface MinorVerificationResult {
  isMinor: boolean;
  ageYears: number;
  guardianConsentRequired: boolean;
  behavioralTrackingBlocked: boolean; // Always true for minors under DPDP § 9(3) and D7
}

/**
 * Calculates accurate age from Date of Birth string (YYYY-MM-DD) or Date object.
 */
export function calculateAge(dob: string | Date, referenceDate: Date = new Date()): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid Date of Birth format.');
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Assesses whether a patient is a minor under Indian statutory law (under 18 years).
 */
export function evaluateMinorStatus(dob: string | Date): MinorVerificationResult {
  const ageYears = calculateAge(dob);
  const isMinor = ageYears < 18;

  return {
    isMinor,
    ageYears,
    guardianConsentRequired: isMinor,
    behavioralTrackingBlocked: isMinor, // Enforce DPDP § 9(3) & D7
  };
}

/**
 * Trilingual Minor Statutory Notice (§ 9 DPDP Act)
 * Note: Non-English translations are machine-assisted: NEEDS HUMAN REVIEW
 */
export const MINOR_PROTECTION_NOTICES: Record<
  SupportedLanguage,
  {
    title: string;
    guardianRequirement: string;
    trackingBanNotice: string;
  }
> = {
  en: {
    title: 'Statutory Notice for Children & Guardians (DPDP Act 2023 § 9)',
    guardianRequirement: 'This patient is under 18 years of age. Telemedicine consultations require the verified consent of a parent or lawful guardian. The guardian must be present during intake and consent authorization.',
    trackingBanNotice: 'Under Section 9(3) of the DPDP Act 2023 and our clinical safety policy, all automated behavioral tracking, facial micro-expression analysis, and bio-acoustic distress scoring are permanently disabled for minors.',
  },
  hi: {
    title: 'बच्चों एवं अभिभावकों के लिए वैधानिक सूचना (DPDP अधिनियम 2023 § 9) [NEEDS HUMAN REVIEW]',
    guardianRequirement: 'यह मरीज 18 वर्ष से कम आयु का है। टेलीमेडिसिन परामर्श के लिए माता-पिता या कानूनी अभिभावक की सत्यापित सहमति आवश्यक है। [NEEDS HUMAN REVIEW]',
    trackingBanNotice: 'DPDP अधिनियम 2023 की धारा 9(3) के तहत, नाबालिगों के लिए सभी स्वचालित व्यवहार ट्रैकिंग, चेहरे के सूक्ष्म भाव विश्लेषण और आवाज स्कोरिंग को पूरी तरह से अक्षम कर दिया गया है। [NEEDS HUMAN REVIEW]',
  },
  mr: {
    title: 'मुले आणि पालकांसाठी वैधानिक सूचना (DPDP कायदा २०२३ § ९) [NEEDS HUMAN REVIEW]',
    guardianRequirement: 'हा रुग्ण १८ वर्षांपेक्षा कमी वयाचा आहे. टेलिमेडिसिन सल्लामसलतीसाठी पालक किंवा कायदेशीर पालकांची सत्यापित संमती आवश्यक आहे. [NEEDS HUMAN REVIEW]',
    trackingBanNotice: 'DPDP कायदा २०२३ च्या कलम ९(३) नुसार, अल्पवयीन मुलांसाठी सर्व स्वयंचलित वर्तणूक ट्रॅकिंग, चेहऱ्यावरील सूक्ष्म हावभाव विश्लेषण आणि आवाज विश्लेषण कायमस्वरूपी बंद केले आहे. [NEEDS HUMAN REVIEW]',
  },
};

/**
 * Validates whether a minor can initiate or participate in a consultation.
 */
export function canMinorParticipateInConsult(params: {
  isMinor: boolean;
  hasVerifiedGuardian: boolean;
  guardianConsentActive: boolean;
}): { allowed: boolean; reason?: string } {
  if (!params.isMinor) {
    return { allowed: true };
  }

  if (!params.hasVerifiedGuardian) {
    return {
      allowed: false,
      reason: 'GUARDIAN_LINK_REQUIRED: Minors under 18 must have a verified parent or legal guardian linked to their profile.',
    };
  }

  if (!params.guardianConsentActive) {
    return {
      allowed: false,
      reason: 'GUARDIAN_CONSENT_REQUIRED: Verifiable guardian consent must be actively recorded before tele-consultation can commence.',
    };
  }

  return { allowed: true };
}
