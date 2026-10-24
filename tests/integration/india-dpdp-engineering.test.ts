import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordPatientConsent,
  verifyStoredConsent,
  revokePatientConsent,
  issueConsentToken,
  verifyConsentStatus,
  revokeConsentToken,
  clearConsentStoreForTesting,
  DPDP_CONSENT_NOTICES,
} from '@/lib/consent/consent-store';
import {
  submitDpdpRequest,
  listDpdpRequestsForOrg,
  listDpdpRequestsForPatient,
  updateDpdpRequestStatus,
  processErasureRequest,
  generateDataExportBundle,
  registerNominee,
  clearDpdpRequestsForTesting,
} from '@/lib/dpdp/data-principal-rights';
import {
  calculateAge,
  evaluateMinorStatus,
  canMinorParticipateInConsult,
} from '@/lib/dpdp/guardian-consent';
import {
  recordSecurityIncident,
  getIncidentCountdown,
  generateCertInReport,
  generateDpbiReport,
  generatePrincipalBreachNotice,
  clearIncidentStoreForTesting,
} from '@/lib/compliance/incident-register';
import {
  validateNoAadhaar,
  validateAbha,
  maskPhone,
  maskEmail,
  scrubPii,
} from '@/lib/privacy/masking';
import { SafeLogger } from '@/lib/telemetry/log-scrubber';

describe('Part 2: India DPDP Act 2023 Engineering & Compliance Suite', () => {
  beforeEach(() => {
    clearConsentStoreForTesting();
    clearDpdpRequestsForTesting();
    clearIncidentStoreForTesting();
  });

  // --------------------------------------------------------------------------
  // 1. Consent Architecture (§ 5 & § 6 DPDP Act)
  // --------------------------------------------------------------------------
  describe('1. Itemized, Unbundled & Revocable Consent Engine', () => {
    it('persists itemized consent in English, Hindi, and Marathi with statutory notices', async () => {
      // Assert trilingual notice structures exist and have all 5 discrete purposes
      for (const lang of ['en', 'hi', 'mr'] as const) {
        const notice = DPDP_CONSENT_NOTICES[lang];
        expect(notice).toBeDefined();
        expect(notice.purposes.consultation).toBeDefined();
        expect(notice.purposes.camera_microphone).toBeDefined();
        expect(notice.purposes.recording).toBeDefined();
        expect(notice.purposes.research_analysis).toBeDefined();
        expect(notice.purposes.storage_sharing).toBeDefined();
      }

      // Record Hindi consent for Indian patient
      const record = await recordPatientConsent({
        patientId: 'pat_rajesh_delhi',
        orgId: 'org_delhi_psychiatry',
        language: 'hi',
        purposes: {
          consultation: true,
          camera_microphone: true,
          recording: false,
          research_analysis: false,
          storage_sharing: true,
        },
      });

      expect(record.patientId).toBe('pat_rajesh_delhi');
      expect(record.language).toBe('hi');
      expect(record.purposes.consultation).toBe(true);
      expect(record.purposes.research_analysis).toBe(false);
      expect(record.revoked).toBe(false);

      // Verify active consultation consent
      const consultCheck = await verifyStoredConsent('pat_rajesh_delhi', 'org_delhi_psychiatry', 'consultation');
      expect(consultCheck.isValid).toBe(true);

      // Verify unconsented research analysis is blocked
      const researchCheck = await verifyStoredConsent('pat_rajesh_delhi', 'org_delhi_psychiatry', 'research_analysis');
      expect(researchCheck.isValid).toBe(false);
      expect(researchCheck.reason).toContain('research_analysis');
    });

    it('supports immediate mid-call consent withdrawal and ceases processing', async () => {
      const patientId = 'pat_ananya_mumbai';
      const orgId = 'org_mumbai_clinic';

      // Patient joins call with valid signed token
      const token = await issueConsentToken(patientId, orgId, { consultation: true, camera_microphone: true });
      const initialStatus = await verifyConsentStatus(token);
      expect(initialStatus.isValid).toBe(true);

      // Patient withdraws consent mid-call
      revokeConsentToken(token);
      await revokePatientConsent(patientId, orgId);

      // Subsequent token and server verification must immediately fail closed
      const midCallStatus = await verifyConsentStatus(token);
      expect(midCallStatus.isValid).toBe(false);
      expect(midCallStatus.reason).toContain('revoked');

      const serverCheck = await verifyStoredConsent(patientId, orgId, 'consultation');
      expect(serverCheck.isValid).toBe(false);
      expect(serverCheck.reason).toContain('withdrew DPDP consent');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Data Principal Rights (§ 11 – § 14 DPDP Act)
  // --------------------------------------------------------------------------
  describe('2. Data Principal Rights & Statutory Legal Holds', () => {
    it('generates machine-readable data export for Right to Access (§ 11)', async () => {
      const bundle = await generateDataExportBundle('pat_kavita_pune', 'org_pune_health');
      expect(bundle.exportVersion).toBe('DPDP_PORTABILITY_V1');
      expect(bundle.patientId).toBe('pat_kavita_pune');
      expect(bundle.dataFiduciary).toBeDefined();
    });

    it('enforces mandatory 3-year NMC legal hold during Right to Erasure (§ 12)', async () => {
      const result = await processErasureRequest({
        patientId: 'pat_rohit_chennai',
        orgId: 'org_chennai_neuro',
      });

      // Clinical medical records MUST NOT be deleted (NMC 3-year minimum retention)
      expect(result.clinicalRecordsErased).toBe(false);
      expect(result.telemetryErased).toBe(true); // Derived non-mandatory telemetry purged
      expect(result.legalHoldNotice).toContain('CLINICAL RECORD LEGAL HOLD');
      expect(result.legalHoldNotice).toContain('minimum of 3 years');
    });

    it('tracks DPDP request lifecycle and 30-day statutory due date in admin queue', async () => {
      const now = Date.now();
      const req = await submitDpdpRequest({
        patientId: 'pat_vikram_bangalore',
        orgId: 'org_bangalore_mind',
        type: 'correction',
        details: { field: 'phone', oldValue: '+91 9800000000', newValue: '+91 9900000000' },
      });

      expect(req.id).toMatch(/^dpdp_req_/);
      expect(req.status).toBe('pending');
      // Due date is 30 days into the future
      expect(req.dueDate - now).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -4);

      // Clinic admin updates status
      const updated = await updateDpdpRequestStatus({
        requestId: req.id,
        actorId: 'usr_admin_101',
        actorRole: 'clinic_manager',
        status: 'fulfilled',
        resolutionNotes: 'Updated verified phone number in hospital database.',
      });

      expect(updated?.status).toBe('fulfilled');
      expect(updated?.resolvedBy).toBe('usr_admin_101');

      // Admin queue lists request
      const queue = listDpdpRequestsForOrg('org_bangalore_mind');
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe(req.id);
    });

    it('registers a Nominated Representative under § 14 DPDP and § 14 Mental Healthcare Act 2017', async () => {
      const nominee = await registerNominee({
        patientId: 'pat_sunita_kolkata',
        orgId: 'org_kolkata_care',
        nominee: {
          name: 'Amitava Mukherjee',
          relationship: 'Spouse / Nominated Representative',
          phone: '+91 98310 12345',
          email: 'amitava.m@kolkatamail.in',
          registeredAt: Date.now(),
        },
      });

      expect(nominee.name).toBe('Amitava Mukherjee');
      expect(nominee.relationship).toContain('Nominated Representative');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Protection of Minors (§ 9 DPDP Act & Default D7)
  // --------------------------------------------------------------------------
  describe('3. Children & Minor Protection Protocols', () => {
    it('evaluates minor status accurately and mandates guardian consent', () => {
      // 16-year-old patient
      const minorDob = new Date();
      minorDob.setFullYear(minorDob.getFullYear() - 16);
      const minorEval = evaluateMinorStatus(minorDob);

      expect(minorEval.isMinor).toBe(true);
      expect(minorEval.guardianConsentRequired).toBe(true);
      expect(minorEval.behavioralTrackingBlocked).toBe(true); // Default D7: strictly disabled for minors

      // 25-year-old adult patient
      const adultDob = new Date();
      adultDob.setFullYear(adultDob.getFullYear() - 25);
      const adultEval = evaluateMinorStatus(adultDob);

      expect(adultEval.isMinor).toBe(false);
      expect(adultEval.guardianConsentRequired).toBe(false);
      expect(adultEval.behavioralTrackingBlocked).toBe(false);
    });

    it('blocks minor without guardian consent, but permits minor with verified guardian', () => {
      // Minor without guardian -> BLOCKED
      const unlinkedMinor = canMinorParticipateInConsult({
        isMinor: true,
        hasVerifiedGuardian: false,
        guardianConsentActive: false,
      });
      expect(unlinkedMinor.allowed).toBe(false);
      expect(unlinkedMinor.reason).toContain('GUARDIAN_LINK_REQUIRED');

      // Minor linked but consent inactive -> BLOCKED
      const unconsentedMinor = canMinorParticipateInConsult({
        isMinor: true,
        hasVerifiedGuardian: true,
        guardianConsentActive: false,
      });
      expect(unconsentedMinor.allowed).toBe(false);
      expect(unconsentedMinor.reason).toContain('GUARDIAN_CONSENT_REQUIRED');

      // Minor with verified active guardian consent -> PERMITTED
      const verifiedMinor = canMinorParticipateInConsult({
        isMinor: true,
        hasVerifiedGuardian: true,
        guardianConsentActive: true,
      });
      expect(verifiedMinor.allowed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Incident Register & Statutory Dual-Clock Breach Handling
  // --------------------------------------------------------------------------
  describe('4. Cybersecurity Incident Register & Dual-Clock Deadlines', () => {
    it('computes 6-hour CERT-In and 72-hour DPBI statutory countdowns', async () => {
      const now = Date.now();
      const incident = await recordSecurityIncident({
        title: 'Unauthorized API Probe on Telemetry Bucket',
        severity: 'P1_CRITICAL',
        type: 'UNAUTHORIZED_HEALTH_DATA_ACCESS',
        affectedOrgIds: ['org_aiims_delhi'],
        affectedDataPrincipalsEstimate: 45,
        dataCategoriesAffected: ['telemetry_streams', 'consult_timestamps'],
        summary: 'External IP scanned open S3-compatible staging bucket. Access token immediately invalidated.',
        detectedAt: now,
        actorId: 'usr_ciso_99',
        actorRole: 'compliance_officer',
      });

      // 6-hour clock for CERT-In
      expect(incident.certInDeadline - now).toBe(6 * 60 * 60 * 1000);
      // 72-hour clock for DPBI
      expect(incident.dpbiDeadline - now).toBe(72 * 60 * 60 * 1000);

      // 1 hour later
      const countdown = getIncidentCountdown(incident, now + 1 * 60 * 60 * 1000);
      expect(countdown.certInHoursRemaining).toBeCloseTo(5.0, 1);
      expect(countdown.certInOverdue).toBe(false);
      expect(countdown.dpbiHoursRemaining).toBeCloseTo(71.0, 1);
      expect(countdown.dpbiOverdue).toBe(false);
    });

    it('generates statutory CERT-In and DPBI breach notification reports', async () => {
      const incident = await recordSecurityIncident({
        title: 'Simulated Network Disruption',
        severity: 'P2_HIGH',
        type: 'SERVICE_DISRUPTION_OR_OUTAGE',
        affectedOrgIds: ['org_apollo_tele'],
        affectedDataPrincipalsEstimate: 120,
        dataCategoriesAffected: ['call_signaling_metadata'],
        summary: 'WebRTC TURN relay encountered transient failover delay.',
        actorId: 'usr_ciso_99',
        actorRole: 'compliance_officer',
      });

      const certInDoc = generateCertInReport(incident);
      expect(certInDoc).toContain('CERT-In Mandatory Cybersecurity Incident Notification');
      expect(certInDoc).toContain('Section 70B');
      expect(certInDoc).toContain(incident.id);

      const dpbiDoc = generateDpbiReport(incident);
      expect(dpbiDoc).toContain('Data Protection Board of India (DPBI)');
      expect(dpbiDoc).toContain('Section 8(6)');
      expect(dpbiDoc).toContain('72-Hour');

      // Trilingual principal notification
      const noticeEn = generatePrincipalBreachNotice(incident, 'en');
      const noticeHi = generatePrincipalBreachNotice(incident, 'hi');
      const noticeMr = generatePrincipalBreachNotice(incident, 'mr');

      expect(noticeEn.body).toContain('security incident');
      expect(noticeHi.body).toContain('सुरक्षा घटना');
      expect(noticeMr.body).toContain('सुरक्षा घटना');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Data Minimization, Masking & Log Scrubbing
  // --------------------------------------------------------------------------
  describe('5. Data Minimization, Zero-Aadhaar Defense & Log Scrubbing', () => {
    it('strictly prohibits Aadhaar collection in text or payloads', () => {
      // Valid payloads (no Aadhaar)
      expect(validateNoAadhaar({ name: 'Rahul Sharma', city: 'Mumbai' }).isValid).toBe(true);

      // Invalid payload: 12-digit Indian Aadhaar pattern
      const directAadhaar = validateNoAadhaar('Patient provided UID 2345 6789 0123 for verification.');
      expect(directAadhaar.isValid).toBe(false);
      expect(directAadhaar.error).toContain('AADHAAR_COLLECTION_PROHIBITED');

      // Nested object with Aadhaar
      const nestedAadhaar = validateNoAadhaar({
        intakeNotes: 'Gov ID: 9876-5432-1098 submitted',
      });
      expect(nestedAadhaar.isValid).toBe(false);
      expect(nestedAadhaar.error).toContain('AADHAAR_COLLECTION_PROHIBITED');
    });

    it('validates optional ABHA (Ayushman Bharat Health Account) identifiers', () => {
      expect(validateAbha('').isValid).toBe(true); // Optional
      expect(validateAbha('14-1234-5678-9012').isValid).toBe(true);
      expect(validateAbha('14-1234-5678-9012').type).toBe('id');
      expect(validateAbha('rajesh.kumar@abdm').isValid).toBe(true);
      expect(validateAbha('rajesh.kumar@abdm').type).toBe('address');

      // Malformed
      expect(validateAbha('invalid_abha_identifier').isValid).toBe(false);
    });

    it('masks Indian phone numbers and emails for display', () => {
      expect(maskPhone('+91 9876543210')).toBe('+91 98****3210');
      expect(maskPhone('9876543210')).toBe('98****3210');
      expect(maskEmail('dr.mehta@delhiclinic.in')).toBe('d****a@delhiclinic.in');
    });

    it('deeply scrubs PII, Aadhaar, PAN, phones, and SOAP clinical content before logging', () => {
      const rawPayload = {
        patientEmail: 'patient.private@delhihealth.com',
        contactNumber: '+91 9876543210',
        nationalTaxId: 'ABCDE1234F',
        aadhaarDoc: '2345 6789 0123',
        soapAssessment: 'Major Depressive Disorder with suicidal ideation, prescribed Sertraline 50mg.',
        sessionDurationSec: 1800,
      };

      const cleaned = scrubPii(rawPayload) as Record<string, unknown>;

      expect(cleaned.patientEmail).toBe('[REDACTED_EMAIL]');
      expect(cleaned.contactNumber).toBe('[REDACTED_PHONE]');
      expect(cleaned.nationalTaxId).toBe('[REDACTED_PAN]');
      expect(cleaned.aadhaarDoc).toBe('[REDACTED_AADHAAR]');
      expect(cleaned.soapAssessment).toBe('[REDACTED_CLINICAL_PHI]');
      expect(cleaned.sessionDurationSec).toBe(1800); // Non-PII telemetry preserved
    });
  });
});
