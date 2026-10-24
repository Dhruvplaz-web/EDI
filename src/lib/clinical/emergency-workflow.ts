/**
 * Praxis AI - Emergency Referral & Mental Healthcare Act 2017 Touchpoints
 * 
 * Supports:
 * 1. Emergency referral slip generation when a telemedicine consult cannot continue
 *    or patient presents with acute psychiatric crisis.
 * 2. Plain-language patient rights notice under Mental Healthcare Act 2017 (§ 18 - § 28).
 * 3. Verified Indian emergency and mental health helplines (Tele-MANAS, KIRAN, 112).
 * 
 * Tag: REQUIRES LAWYER REVIEW • REQUIRES DOCTOR REVIEW
 */

import { SupportedLanguage } from '@/lib/consent/consent-store';

export interface EmergencyReferralSlip {
  id: string;
  consultationId: string;
  createdAt: number;
  patientName: string;
  patientAge: number;
  patientSex: string;
  referringDoctorName: string;
  referringDoctorRegNo: string;
  reasonForReferral: string;
  urgencyLevel: 'EMERGENCY_IMMEDIATE' | 'URGENT_WITHIN_24_HOURS';
  nearestHospitalRecommended: string;
  emergencyHelplines: Array<{ name: string; number: string; description: string }>;
  statutoryNotice: string;
}

export const VERIFIED_INDIA_HELPLINES = [
  {
    name: 'National Emergency Number',
    number: '112',
    description: 'Police, Fire, and Ambulance pan-India emergency integration.',
    verifiedDate: 'Late October 2026',
  },
  {
    name: 'Tele-MANAS (MoHFW)',
    number: '14416 / 1800-891-4416',
    description: 'Government of India National Tele Mental Health Programme (Toll-free 24/7, 20+ Indian languages).',
    verifiedDate: 'Late October 2026',
  },
  {
    name: 'KIRAN (DEPwD / MSJE)',
    number: '1800-599-0019',
    description: 'Mental health rehabilitation and suicide prevention helpline (Toll-free 24/7).',
    verifiedDate: 'Late October 2026',
  },
];

/**
 * Generates a structured Emergency Referral Slip.
 */
export function generateEmergencyReferralSlip(params: {
  consultationId: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  referringDoctorName: string;
  referringDoctorRegNo: string;
  reasonForReferral: string;
  urgencyLevel: 'EMERGENCY_IMMEDIATE' | 'URGENT_WITHIN_24_HOURS';
  nearestHospitalRecommended: string;
}): EmergencyReferralSlip {
  const now = Date.now();
  const id = `ref_slip_${now}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    consultationId: params.consultationId,
    createdAt: now,
    patientName: params.patientName,
    patientAge: params.patientAge,
    patientSex: params.patientSex,
    referringDoctorName: params.referringDoctorName,
    referringDoctorRegNo: params.referringDoctorRegNo,
    reasonForReferral: params.reasonForReferral,
    urgencyLevel: params.urgencyLevel,
    nearestHospitalRecommended: params.nearestHospitalRecommended,
    emergencyHelplines: VERIFIED_INDIA_HELPLINES,
    statutoryNotice:
      'EMERGENCY TELEMEDICINE REFERRAL: Telemedicine consultation cannot substitute for in-person emergency care in acute psychiatric crisis. Patient advised to immediately present to the nearest hospital casualty / emergency department. (NMC Telemedicine Guidelines 2020 Clause 3.7.4)',
  };
}

/**
 * Trilingual Plain-Language Patient Rights under Mental Healthcare Act 2017
 * Note: Non-English text is machine-assisted: NEEDS HUMAN REVIEW
 */
export const MHA_PATIENT_RIGHTS: Record<
  SupportedLanguage,
  {
    title: string;
    rights: Array<{ heading: string; detail: string }>;
  }
> = {
  en: {
    title: 'Your Statutory Rights under the Mental Healthcare Act, 2017',
    rights: [
      {
        heading: 'Right to Access Mental Healthcare (§ 18)',
        detail: 'Every person has a statutory right to access mental healthcare and treatment from mental health services run or funded by the government.',
      },
      {
        heading: 'Right to Confidentiality (§ 23)',
        detail: 'All information relating to your mental health, treatment, and medical records is strictly confidential and cannot be released without your informed consent.',
      },
      {
        heading: 'Right to Appoint a Nominated Representative (§ 14)',
        detail: 'You have the right to nominate an adult representative of your choice to support your care and make decisions if you experience incapacity.',
      },
      {
        heading: 'Protection from Inhumane Treatment (§ 20)',
        detail: 'Every person with mental illness has the right to live with dignity and be protected from cruel, inhuman, or degrading treatment.',
      },
    ],
  },
  hi: {
    title: 'मानसिक स्वास्थ्य देखभाल अधिनियम, 2017 के तहत आपके वैधानिक अधिकार [NEEDS HUMAN REVIEW]',
    rights: [
      {
        heading: 'मानसिक स्वास्थ्य सेवाओं तक पहुंच का अधिकार (§ 18) [NEEDS HUMAN REVIEW]',
        detail: 'प्रत्येक व्यक्ति को सरकार द्वारा संचालित या वित्तपोषित मानसिक स्वास्थ्य सेवाओं से उपचार प्राप्त करने का अधिकार है। [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'गोपनीयता का अधिकार (§ 23) [NEEDS HUMAN REVIEW]',
        detail: 'आपके मानसिक स्वास्थ्य और मेडिकल रिकॉर्ड से संबंधित सभी जानकारी पूरी तरह गोपनीय रखी जाएगी। [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'नामित प्रतिनिधि नियुक्त करने का अधिकार (§ 14) [NEEDS HUMAN REVIEW]',
        detail: 'आपको अपनी पसंद के किसी वयस्क व्यक्ति को अपना नामित प्रतिनिधि चुनने का अधिकार है। [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'गरिमापूर्ण जीवन का अधिकार (§ 20) [NEEDS HUMAN REVIEW]',
        detail: 'प्रत्येक व्यक्ति को सम्मानपूर्वक जीने और क्रूर या अमानवीय व्यवहार से सुरक्षित रहने का अधिकार है। [NEEDS HUMAN REVIEW]',
      },
    ],
  },
  mr: {
    title: 'मानसिक आरोग्य काळजी कायदा, २०१७ अंतर्गत आपले वैधानिक अधिकार [NEEDS HUMAN REVIEW]',
    rights: [
      {
        heading: 'मानसिक आरोग्य सेवा मिळवण्याचा अधिकार (§ १८) [NEEDS HUMAN REVIEW]',
        detail: 'प्रत्येक व्यक्तीला शासकीय किंवा अनुदानित मानसिक आरोग्य सेवांमधून उपचार घेण्याचा कायदेशीर अधिकार आहे. [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'गोपनीयतेचा अधिकार (§ २३) [NEEDS HUMAN REVIEW]',
        detail: 'तुमच्या उपचारांशी आणि वैद्यकीय नोंदींशी संबंधित सर्व माहिती पूर्णपणे गोपनीय ठेवली जाईल. [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'नामित प्रतिनिधी नियुक्त करण्याचा अधिकार (§ १४) [NEEDS HUMAN REVIEW]',
        detail: 'तुम्हाला तुमच्या पसंतीच्या प्रौढ व्यक्तीला तुमचा नामित प्रतिनिधी म्हणून निवडण्याचा अधिकार आहे. [NEEDS HUMAN REVIEW]',
      },
      {
        heading: 'सन्मानपूर्वक जगण्याचा अधिकार (§ २०) [NEEDS HUMAN REVIEW]',
        detail: 'प्रत्येक व्यक्तीला सन्मानाने जगण्याचा आणि क्रूर किंवा अमानुष वागणुकीपासून सुरक्षित राहण्याचा अधिकार आहे. [NEEDS HUMAN REVIEW]',
      },
    ],
  },
};
