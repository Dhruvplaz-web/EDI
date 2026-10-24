/**
 * Praxis AI - India Mental Health Crisis & Emergency Helplines Configuration
 * 
 * Statutory & Regulatory Grounding:
 * - Tele-MANAS (MoHFW & NIMHANS): 14416 / 1800-891-4416 (24/7 National Tele-Mental Health Programme)
 *   Source: https://telemanas.mohfw.gov.in (Verified: 24 October 2026)
 * - KIRAN Helpline (MSJE / DEPwD): 1800-599-0019 (24/7 Mental Health Rehabilitation)
 *   Source: https://disabilityaffairs.gov.in (Verified: 24 October 2026)
 * - National Emergency Number: 112 (Ministry of Home Affairs ERSS)
 *   Source: https://112.gov.in (Verified: 24 October 2026)
 * - Vandrevala Foundation Helpline: 9999-666-555 (Verified: 24 October 2026)
 * 
 * Strict Autonomy & Safety Directives:
 * - Never hardcode helpline numbers in UI templates; always load from this verified configuration.
 * - Every helpline records its official source URL, operating hours, languages, and last verified date.
 * - Label: ASSISTIVE CRISIS RESOURCES ONLY. Not an emergency response replacement.
 */

export interface VerifiedCrisisHelpline {
  id: string;
  name: {
    en: string;
    hi: string;
    mr: string;
  };
  dialNumber: string; // tel: link format
  displayNumber: string;
  tollFree: boolean;
  operatingHours: string;
  languagesSupported: string[];
  governingBody: string;
  officialSourceUrl: string;
  lastVerifiedDate: string; // ISO format DD/MM/YYYY
  primaryFocus: string;
}

export interface ClinicEscalationOfficer {
  name: string;
  role: string;
  registrationNumber?: string;
  phone: string;
  alternatePhone?: string;
  availableHours: string;
}

export interface ClinicCrisisConfig {
  orgId: string;
  clinicName: string;
  onCallOfficer?: ClinicEscalationOfficer;
  crisisEscalationEmail?: string;
  designatedHospitalAddress?: string;
  designatedHospitalEmergencyPhone?: string;
  hasDocumentedPoliceDispatchProtocol: boolean;
  hasDocumentedFamilyContactProtocol: boolean;
}

export const VERIFIED_INDIA_CRISIS_HELPLINES: VerifiedCrisisHelpline[] = [
  {
    id: 'tele-manas',
    name: {
      en: 'Tele-MANAS (National Mental Health Helpline)',
      hi: 'टेली-मानस (राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन)',
      mr: 'टेली-मानस (राष्ट्रीय मानसिक आरोग्य हेल्पलाइन)',
    },
    dialNumber: '14416',
    displayNumber: '14416 / 1800-891-4416',
    tollFree: true,
    operatingHours: '24/7 (365 days)',
    languagesSupported: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Malayalam', 'Odia', 'Punjabi', 'Assamese'],
    governingBody: 'Ministry of Health and Family Welfare (MoHFW) & NIMHANS Bengaluru',
    officialSourceUrl: 'https://telemanas.mohfw.gov.in',
    lastVerifiedDate: '24/10/2026',
    primaryFocus: '24/7 multi-tiered psychiatric counseling, crisis de-escalation, and referral to district mental health units (DMHP).',
  },
  {
    id: 'kiran',
    name: {
      en: 'KIRAN Mental Health Helpline',
      hi: 'किरण मानसिक स्वास्थ्य पुनर्वास हेल्पलाइन',
      mr: 'किरण मानसिक आरोग्य पुनर्वसन हेल्पलाइन',
    },
    dialNumber: '18005990019',
    displayNumber: '1800-599-0019',
    tollFree: true,
    operatingHours: '24/7 (365 days)',
    languagesSupported: ['Hindi', 'English', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Odia', 'Bengali', 'Assamese', 'Punjabi', 'Urdu'],
    governingBody: 'Department of Empowerment of Persons with Disabilities, Ministry of Social Justice and Empowerment (MSJE)',
    officialSourceUrl: 'https://disabilityaffairs.gov.in',
    lastVerifiedDate: '24/10/2026',
    primaryFocus: 'Early screening, psychological first aid, crisis intervention, mental well-being, and psychological rehabilitation.',
  },
  {
    id: 'national-emergency-112',
    name: {
      en: 'National Emergency Response Support System (ERSS)',
      hi: 'राष्ट्रीय आपातकालीन हेल्पलाइन',
      mr: 'राष्ट्रीय आपत्कालीन सेवा प्रणाली',
    },
    dialNumber: '112',
    displayNumber: '112',
    tollFree: true,
    operatingHours: '24/7 (Immediate Dispatch)',
    languagesSupported: ['English', 'Hindi', 'Regional State Languages'],
    governingBody: 'Ministry of Home Affairs (MHA), Government of India',
    officialSourceUrl: 'https://112.gov.in',
    lastVerifiedDate: '24/10/2026',
    primaryFocus: 'Immediate emergency dispatch for life-threatening situations, ambulance, police, and fire services.',
  },
  {
    id: 'vandrevala-foundation',
    name: {
      en: 'Vandrevala Foundation Mental Health Helpline',
      hi: 'वांद्रेवाला फाउंडेशन मानसिक स्वास्थ्य सहायता',
      mr: 'वांद्रेवाला फाउंडेशन मानसिक आरोग्य सहाय्यता',
    },
    dialNumber: '+919999666555',
    displayNumber: '+91 9999 666 555',
    tollFree: false,
    operatingHours: '24/7 (365 days)',
    languagesSupported: ['English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu'],
    governingBody: 'Vandrevala Foundation (Non-Governmental Mental Health Organization)',
    officialSourceUrl: 'https://www.vandrevalafoundation.com',
    lastVerifiedDate: '24/10/2026',
    primaryFocus: 'Confidential crisis intervention, emotional distress counseling, and suicide prevention support.',
  },
];

export const CRISIS_DISCLAIMER_TEXTS = {
  en: 'ASSISTIVE CRISIS RESOURCES ONLY. Praxis AI is a clinical documentation tool and NOT an emergency medical service, suicide prevention monitoring tool, or medical device. If you or someone you know is in immediate life-threatening distress, immediately dial 112 or visit the casualty department of the nearest hospital.',
  hi: 'केवल सहायक संकट संसाधन। प्राक्सिस एआई एक क्लिनिकल दस्तावेज़ उपकरण है और यह कोई आपातकालीन चिकित्सा सेवा, आत्महत्या रोकथाम निगरानी प्रणाली या चिकित्सा उपकरण नहीं है। यदि आप या कोई परिचित तत्काल संकट में है, तो तुरंत 112 पर कॉल करें या निकटतम अस्पताल के आपातकालीन विभाग में जाएं। [NEEDS HUMAN REVIEW]',
  mr: 'केवळ साहाय्यक संकटकालीन संसाधने. प्रॅक्सिस एआय हे क्लिनिकल दस्तऐवजीकरण साधन आहे आणि ही कोणतीही आपत्कालीन वैद्यकीय सेवा, आत्महत्या प्रतिबंधक प्रणाली किंवा वैद्यकीय उपकरण नाही. आपण किंवा आपल्या ओळखीची व्यक्ती तात्काळ संकटात असल्यास, त्वरित ११२ वर कॉल करा किंवा जवळच्या रुग्णालयाशी संपर्क साधा. [NEEDS HUMAN REVIEW]',
};

/**
 * Returns verified crisis configuration for a tenant clinic, combining national helplines
 * with tenant-specific on-call emergency escalation contacts.
 */
export function getCrisisConfigForClinic(clinicConfig?: Partial<ClinicCrisisConfig>): {
  helplines: VerifiedCrisisHelpline[];
  clinicContacts?: ClinicEscalationOfficer;
  disclaimers: typeof CRISIS_DISCLAIMER_TEXTS;
  lastVerifiedDate: string;
} {
  return {
    helplines: VERIFIED_INDIA_CRISIS_HELPLINES,
    clinicContacts: clinicConfig?.onCallOfficer,
    disclaimers: CRISIS_DISCLAIMER_TEXTS,
    lastVerifiedDate: '24/10/2026',
  };
}
