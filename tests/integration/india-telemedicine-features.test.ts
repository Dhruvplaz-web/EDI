import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerPractitioner,
  setPractitionerVerification,
  assertPractitionerCanStartConsult,
  assertPractitionerCanPrescribe,
  clearPractitionerStoreForTesting,
  getOfficialRegistryUrl,
} from '@/lib/clinical/practitioner-registry';
import {
  createEPrescription,
  classifyDrugCategory,
  validatePrescriptionItem,
  generatePrescriptionHtml,
  PrescriptionItem,
} from '@/lib/clinical/prescription-engine';
import {
  generateEmergencyReferralSlip,
  VERIFIED_INDIA_HELPLINES,
  MHA_PATIENT_RIGHTS,
} from '@/lib/clinical/emergency-workflow';

describe('Part 4: India Telemedicine Guidelines 2020 & Mental Healthcare Act 2017 Suite', () => {
  beforeEach(() => {
    clearPractitionerStoreForTesting();
  });

  // --------------------------------------------------------------------------
  // 1. Practitioner Onboarding & Verification Gate
  // --------------------------------------------------------------------------
  describe('1. Practitioner Onboarding & Verification Gating', () => {
    it('generates official verification registry lookup URLs for NMC and RCI', () => {
      const nmcUrl = getOfficialRegistryUrl('Maharashtra Medical Council', '84920/2018');
      expect(nmcUrl).toContain('nmc.org.in');
      expect(nmcUrl).toContain('84920%2F2018');

      const rciUrl = getOfficialRegistryUrl('Rehabilitation Council of India', 'CRR A12345');
      expect(rciUrl).toContain('rehabcouncil.nic.in');
    });

    it('blocks unverified practitioners from starting consultations', async () => {
      // Register a new psychiatrist
      const profile = await registerPractitioner({
        uid: 'usr_doc_mehta_101',
        orgId: 'org_apex_telehealth',
        name: 'Dr. Anand Mehta',
        email: 'anand.mehta@apex.in',
        practitionerType: 'psychiatrist',
        qualifications: ['MBBS', 'MD (Psychiatry)'],
        registrationNumber: 'DMC 49281',
        medicalCouncil: 'Delhi Medical Council',
        registrationYear: 2015,
      });

      expect(profile.verificationStatus).toBe('pending');

      // Attempt to start consultation while pending -> MUST FAIL CLOSED
      const gateCheck = assertPractitionerCanStartConsult('usr_doc_mehta_101');
      expect(gateCheck.allowed).toBe(false);
      expect(gateCheck.error).toContain('PRACTITIONER_NOT_VERIFIED');
    });

    it('allows verified practitioners to start consultations after administrative review', async () => {
      await registerPractitioner({
        uid: 'usr_doc_mehta_101',
        orgId: 'org_apex_telehealth',
        name: 'Dr. Anand Mehta',
        email: 'anand.mehta@apex.in',
        practitionerType: 'psychiatrist',
        qualifications: ['MBBS', 'MD (Psychiatry)'],
        registrationNumber: 'DMC 49281',
        medicalCouncil: 'Delhi Medical Council',
        registrationYear: 2015,
      });

      // Clinic Admin reviews official registry and verifies practitioner
      const verifiedProfile = await setPractitionerVerification({
        practitionerUid: 'usr_doc_mehta_101',
        adminUid: 'usr_admin_ciso',
        adminRole: 'super_admin',
        status: 'verified',
      });

      expect(verifiedProfile?.verificationStatus).toBe('verified');
      expect(verifiedProfile?.verifiedBy).toBe('usr_admin_ciso');

      // Consult check must now succeed
      const gateCheck = assertPractitionerCanStartConsult('usr_doc_mehta_101');
      expect(gateCheck.allowed).toBe(true);
      expect(gateCheck.profile?.name).toBe('Dr. Anand Mehta');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Clinical Psychologist Prescription Blocking
  // --------------------------------------------------------------------------
  describe('2. Clinical Psychologist Roles & Prescribing Restrictions', () => {
    it('strictly prohibits Clinical Psychologists from issuing medical prescriptions', async () => {
      // Register clinical psychologist (RCI)
      await registerPractitioner({
        uid: 'usr_psych_sharma_02',
        orgId: 'org_apex_telehealth',
        name: 'Pooja Sharma',
        email: 'pooja.sharma@apex.in',
        practitionerType: 'clinical_psychologist',
        qualifications: ['M.Phil Clinical Psychology'],
        registrationNumber: 'CRR A98765',
        medicalCouncil: 'Rehabilitation Council of India',
        registrationYear: 2020,
      });

      // Admin verifies psychologist for psychotherapy consults
      await setPractitionerVerification({
        practitionerUid: 'usr_psych_sharma_02',
        adminUid: 'usr_admin_ciso',
        adminRole: 'clinic_manager',
        status: 'verified',
      });

      // Psychologist CAN start psychological consultations
      const consultCheck = assertPractitionerCanStartConsult('usr_psych_sharma_02');
      expect(consultCheck.allowed).toBe(true);

      // BUT Psychologist CANNOT prescribe medications (hard server-side gate)
      const prescribeCheck = assertPractitionerCanPrescribe('usr_psych_sharma_02');
      expect(prescribeCheck.allowed).toBe(false);
      expect(prescribeCheck.error).toContain('PRESCRIPTION_UNAUTHORIZED_FOR_PSYCHOLOGISTS');
      expect(prescribeCheck.error).toContain('only Registered Medical Practitioners (RMPs) may issue prescriptions');

      // Attempting to create prescription must throw
      await expect(
        createEPrescription({
          practitionerUid: 'usr_psych_sharma_02',
          consultationId: 'con_test_99',
          orgId: 'org_apex_telehealth',
          consultMode: 'video',
          consultType: 'first_consultation',
          patient: { id: 'pat_01', name: 'John Doe', ageYears: 30, sex: 'male' },
          diagnosisNotes: 'Generalized Anxiety Disorder',
          medications: [
            {
              genericName: 'Sertraline',
              dosageForm: 'tablet',
              strength: '50 mg',
              frequency: '1-0-0',
              durationDays: 30,
              totalQuantity: 30,
              drugCategory: 'LIST_A',
            },
          ],
        })
      ).rejects.toThrow(/PRESCRIPTION_UNAUTHORIZED_FOR_PSYCHOLOGISTS/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Drug Classifications & Telemedicine Restrictions (NMC 2020)
  // --------------------------------------------------------------------------
  describe('3. Drug Classifications & Statutory Restrictions (Schedule X & NDPS)', () => {
    it('classifies medications correctly into List O, List A, List B, and Prohibited categories', () => {
      // Prohibited
      expect(classifyDrugCategory('Ketamine 50mg/ml')).toBe('SCHEDULE_X_PROHIBITED');
      expect(classifyDrugCategory('Methadone syrup')).toBe('SCHEDULE_X_PROHIBITED');
      expect(classifyDrugCategory('Morphine sulphate')).toBe('NDPS_PROHIBITED');
      expect(classifyDrugCategory('Buprenorphine sublingual')).toBe('NDPS_PROHIBITED');

      // List A
      expect(classifyDrugCategory('Sertraline tablet')).toBe('LIST_A');
      expect(classifyDrugCategory('Escitalopram oxalate')).toBe('LIST_A');
      expect(classifyDrugCategory('Fluoxetine hydrochloride')).toBe('LIST_A');

      // List O (OTC)
      expect(classifyDrugCategory('Paracetamol 650mg')).toBe('LIST_O');
      expect(classifyDrugCategory('ORS powder')).toBe('LIST_O');
    });

    it('hard-blocks Schedule X and NDPS medications from e-prescriptions', () => {
      const bannedItem: PrescriptionItem = {
        genericName: 'Ketamine injection',
        dosageForm: 'drops',
        strength: '50 mg',
        frequency: 'Stat',
        durationDays: 1,
        totalQuantity: 1,
        drugCategory: 'SCHEDULE_X_PROHIBITED',
      };

      const val = validatePrescriptionItem(bannedItem, 'video', 'first_consultation');
      expect(val.isValid).toBe(false);
      expect(val.error).toContain('DRUG_RESTRICTION_PROHIBITED');
      expect(val.error).toContain('Schedule X');
    });

    it('requires Video mode for List A medications on first consultation', () => {
      const listAItem: PrescriptionItem = {
        genericName: 'Sertraline',
        dosageForm: 'tablet',
        strength: '50 mg',
        frequency: '1-0-0',
        durationDays: 14,
        totalQuantity: 14,
        drugCategory: 'LIST_A',
      };

      // Audio-only on First Consult -> BLOCKED
      const audioFirstVal = validatePrescriptionItem(listAItem, 'audio', 'first_consultation');
      expect(audioFirstVal.isValid).toBe(false);
      expect(audioFirstVal.error).toContain('VIDEO_REQUIRED_FOR_LIST_A');

      // Video on First Consult -> PERMITTED
      const videoFirstVal = validatePrescriptionItem(listAItem, 'video', 'first_consultation');
      expect(videoFirstVal.isValid).toBe(true);

      // Audio on Follow-up -> PERMITTED
      const audioFollowUpVal = validatePrescriptionItem(listAItem, 'audio', 'follow_up');
      expect(audioFollowUpVal.isValid).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Standardized NMC E-Prescription Format & HTML Output
  // --------------------------------------------------------------------------
  describe('4. E-Prescription Standard NMC 2020 Generation', () => {
    it('creates structured E-Prescription with verified RMP credentials and printable HTML', async () => {
      // Register and verify psychiatrist
      await registerPractitioner({
        uid: 'usr_doc_chawla_88',
        orgId: 'org_nimhans_partner',
        name: 'Dr. Sunil Chawla',
        email: 'sunil.chawla@delhimentalhealth.in',
        practitionerType: 'psychiatrist',
        qualifications: ['MBBS', 'MD Psychiatry', 'DNB'],
        registrationNumber: 'KMC 78291',
        medicalCouncil: 'Karnataka Medical Council',
        registrationYear: 2012,
      });

      await setPractitionerVerification({
        practitionerUid: 'usr_doc_chawla_88',
        adminUid: 'usr_admin_ciso',
        adminRole: 'super_admin',
        status: 'verified',
      });

      const rx = await createEPrescription({
        practitionerUid: 'usr_doc_chawla_88',
        consultationId: 'con_webrtc_9921',
        orgId: 'org_nimhans_partner',
        consultMode: 'video',
        consultType: 'first_consultation',
        patient: {
          id: 'pat_rohan_32',
          name: 'Rohan Deshmukh',
          ageYears: 34,
          sex: 'male',
          address: 'Pune, Maharashtra',
        },
        diagnosisNotes: 'Major Depressive Episode, single (F32.1). Congruent affect.',
        medications: [
          {
            genericName: 'Escitalopram',
            brandName: 'Nexito',
            dosageForm: 'tablet',
            strength: '10 mg',
            frequency: 'Once daily morning after food (1-0-0)',
            durationDays: 30,
            totalQuantity: 30,
            instructions: 'Take after breakfast. Do not discontinue abruptly.',
            drugCategory: 'LIST_A',
          },
        ],
        followUpAdvice: 'Follow-up consultation in 4 weeks via tele-consultation.',
        clinicInfo: {
          name: 'MindCare Psychiatric Tele-Clinic',
          address: 'Shivajinagar, Pune, Maharashtra 411005',
          contact: '+91 20 2553 1234',
        },
      });

      expect(rx.id).toMatch(/^rx_/);
      expect(rx.isSigned).toBe(true);
      expect(rx.practitioner.registrationNumber).toBe('KMC 78291');
      expect(rx.statutoryNotice).toContain('Telemedicine Practice Guidelines 2020');
      expect(rx.statutoryNotice).toContain('minimum 3 years');

      // HTML generation
      const html = generatePrescriptionHtml(rx);
      expect(html).toContain('MindCare Psychiatric Tele-Clinic');
      expect(html).toContain('Dr. Sunil Chawla');
      expect(html).toContain('KMC 78291');
      expect(html).toContain('ESCITALOPRAM');
      expect(html).toContain('10 mg');
      expect(html).toContain('Telemedicine (VIDEO • FIRST CONSULTATION)');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Emergency Referral & Mental Healthcare Act 2017
  // --------------------------------------------------------------------------
  describe('5. Emergency Workflow & Mental Healthcare Act 2017 Touchpoints', () => {
    it('generates emergency referral slip with verified Indian emergency helplines', () => {
      const slip = generateEmergencyReferralSlip({
        consultationId: 'con_crisis_101',
        patientName: 'Kunal Joshi',
        patientAge: 27,
        patientSex: 'Male',
        referringDoctorName: 'Dr. Anand Mehta',
        referringDoctorRegNo: 'DMC 49281',
        reasonForReferral: 'Acute psychiatric agitation and suicidal intent verbalized during tele-consultation.',
        urgencyLevel: 'EMERGENCY_IMMEDIATE',
        nearestHospitalRecommended: 'AIIMS Emergency Department, Ansari Nagar, New Delhi',
      });

      expect(slip.id).toMatch(/^ref_slip_/);
      expect(slip.urgencyLevel).toBe('EMERGENCY_IMMEDIATE');
      expect(slip.emergencyHelplines.length).toBeGreaterThanOrEqual(3);

      // Verify verified numbers
      const teleManas = slip.emergencyHelplines.find((h) => h.name.includes('Tele-MANAS'));
      expect(teleManas?.number).toContain('14416');
      const emergency = slip.emergencyHelplines.find((h) => h.name.includes('National Emergency'));
      expect(emergency?.number).toBe('112');
      const kiran = slip.emergencyHelplines.find((h) => h.name.includes('KIRAN'));
      expect(kiran?.number).toContain('1800-599-0019');
    });

    it('provides trilingual plain-language Mental Healthcare Act 2017 rights', () => {
      for (const lang of ['en', 'hi', 'mr'] as const) {
        const rightsDoc = MHA_PATIENT_RIGHTS[lang];
        expect(rightsDoc).toBeDefined();
        expect(rightsDoc.rights.length).toBe(4);
        // Assert confidentiality and nominated representative sections exist
        const confRight = rightsDoc.rights.find(
          (r) => r.heading.includes('23') || r.heading.includes('२३') || r.heading.includes('गोपनीयतेचा') || r.heading.includes('गोपनीयता')
        );
        expect(confRight).toBeDefined();
        const nomRight = rightsDoc.rights.find(
          (r) => r.heading.includes('14') || r.heading.includes('१४') || r.heading.includes('नामित')
        );
        expect(nomRight).toBeDefined();
      }
    });
  });
});
