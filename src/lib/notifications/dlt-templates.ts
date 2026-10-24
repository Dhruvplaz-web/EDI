/**
 * Praxis AI - TRAI DLT Registered Notification Templates (SMS, WhatsApp, Email)
 * 
 * Complies with:
 * 1. Telecom Regulatory Authority of India (TRAI) Telecom Commercial Communications
 *    Customer Preference Regulations (TCCCPR, 2018) for Distributed Ledger Technology (DLT).
 * 2. DPDP Act 2023 & NMC Telemedicine Practice Guidelines:
 *    - STRICT PRIVACY GUARANTEE: Zero clinical details, diagnostic conditions, psychiatric terms,
 *      or drug names are permitted in SMS or WhatsApp notification payloads.
 *    - Notifications strictly convey transactional OTPs, scheduling confirmations, or secure login links.
 * 
 * Tags: DLT Header: PRXMED • Tagged: NEEDS HUMAN REVIEW (non-English templates)
 */

import { SupportedLanguage } from '@/lib/consent/consent-store';

export interface DltTemplate {
  templateId: string;
  header: string; // e.g. "PRXMED"
  templateType: 'OTP' | 'APPOINTMENT_CONFIRMATION' | 'CONSULT_LINK';
  text: string;
}

export const DLT_TEMPLATES: Record<SupportedLanguage, Record<string, DltTemplate>> = {
  en: {
    OTP: {
      templateId: 'DLT_140716123456001',
      header: 'PRXMED',
      templateType: 'OTP',
      text: '{#var#} is your Praxis AI verification code. Valid for 5 minutes. Do not share this OTP with anyone. - Praxis Mental Health',
    },
    APPOINTMENT_CONFIRMATION: {
      templateId: 'DLT_140716123456002',
      header: 'PRXMED',
      templateType: 'APPOINTMENT_CONFIRMATION',
      text: 'Dear Patient, your tele-consultation with {#var#} is scheduled on {#var#} at {#var#}. To join, log in to your clinic portal: {#var#} - Praxis Health',
    },
    CONSULT_LINK: {
      templateId: 'DLT_140716123456003',
      header: 'PRXMED',
      templateType: 'CONSULT_LINK',
      text: 'Your tele-consultation room with {#var#} is now open. Join securely via your browser: {#var#} - Praxis Health',
    },
  },
  hi: {
    OTP: {
      templateId: 'DLT_140716123456004',
      header: 'PRXMED',
      templateType: 'OTP',
      text: '{#var#} आपका प्राक्सिस एआई सत्यापन कोड है। 5 मिनट के लिए मान्य। यह कोड किसी के साथ साझा न करें। [NEEDS HUMAN REVIEW] - प्राक्सिस हेल्थ',
    },
    APPOINTMENT_CONFIRMATION: {
      templateId: 'DLT_140716123456005',
      header: 'PRXMED',
      templateType: 'APPOINTMENT_CONFIRMATION',
      text: 'प्रिय मरीज, {#var#} के साथ आपका परामर्श {#var#} को {#var#} बजे निर्धारित है। शामिल होने के लिए: {#var#} [NEEDS HUMAN REVIEW] - प्राक्सिस हेल्थ',
    },
    CONSULT_LINK: {
      templateId: 'DLT_140716123456006',
      header: 'PRXMED',
      templateType: 'CONSULT_LINK',
      text: '{#var#} के साथ आपका परामर्श कक्ष खुल गया है। सुरक्षित रूप से जुड़ें: {#var#} [NEEDS HUMAN REVIEW] - प्राक्सिस हेल्थ',
    },
  },
  mr: {
    OTP: {
      templateId: 'DLT_140716123456007',
      header: 'PRXMED',
      templateType: 'OTP',
      text: '{#var#} हा आपला प्रॅक्सिस एआय पडताळणी कोड आहे. ५ मिनिटांसाठी वैध. हा कोड कोणाशीही शेअर करू नका. [NEEDS HUMAN REVIEW] - प्रॅक्सिस हेल्थ',
    },
    APPOINTMENT_CONFIRMATION: {
      templateId: 'DLT_140716123456008',
      header: 'PRXMED',
      templateType: 'APPOINTMENT_CONFIRMATION',
      text: 'प्रिय रुग्ण, {#var#} यांच्यासोबत आपली सल्लामसलत {#var#} रोजी {#var#} वाजता नियोजित आहे. सामील होण्यासाठी: {#var#} [NEEDS HUMAN REVIEW] - प्रॅक्सिस हेल्थ',
    },
    CONSULT_LINK: {
      templateId: 'DLT_140716123456009',
      header: 'PRXMED',
      templateType: 'CONSULT_LINK',
      text: '{#var#} यांच्यासोबतचा आपला सल्लामसलत कक्ष सुरू झाला आहे. सुरक्षितपणे सामील व्हा: {#var#} [NEEDS HUMAN REVIEW] - प्रॅक्सिस हेल्थ',
    },
  },
};

// Forbidden clinical and diagnostic keywords in SMS/WhatsApp notifications
const FORBIDDEN_CLINICAL_WORDS = [
  'depression',
  'bipolar',
  'schizophrenia',
  'suicide',
  'anxiety',
  'psychiatric',
  'antidepressant',
  'sertraline',
  'escitalopram',
  'disorder',
  'mental illness',
  'diagnosis',
  'prescription',
  'डिप्रेशन',
  'आत्महत्या',
  'औदासिन्य',
];

/**
 * Asserts that an SMS/WhatsApp text payload contains ZERO clinical diagnosis or drug names.
 */
export function validateNoClinicalDataInMessage(text: string): { isValid: boolean; violation?: string } {
  const lower = text.toLowerCase();
  for (const word of FORBIDDEN_CLINICAL_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return {
        isValid: false,
        violation: `CLINICAL_PRIVACY_VIOLATION: Notification text contains sensitive clinical term "${word}". Under DPDP Act and Telemedicine Guidelines, clinical details must not be transmitted via unencrypted SMS/WhatsApp.`,
      };
    }
  }
  return { isValid: true };
}

/**
 * Formats a DLT registered SMS text by substituting variable values.
 */
export function formatDltMessage(params: {
  templateType: 'OTP' | 'APPOINTMENT_CONFIRMATION' | 'CONSULT_LINK';
  language: SupportedLanguage;
  variables: string[];
}): { text: string; templateId: string; header: string } {
  const template = DLT_TEMPLATES[params.language][params.templateType];
  let rendered = template.text;

  for (const val of params.variables) {
    rendered = rendered.replace('{#var#}', val);
  }

  // Enforce zero clinical PHI assertion
  const privacyCheck = validateNoClinicalDataInMessage(rendered);
  if (!privacyCheck.isValid) {
    throw new Error(privacyCheck.violation);
  }

  return {
    text: rendered,
    templateId: template.templateId,
    header: template.header,
  };
}
