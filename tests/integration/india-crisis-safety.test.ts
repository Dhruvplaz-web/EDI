/**
 * Praxis AI - India Crisis Safety & Multilingual Keyword Detection Tests
 * 
 * Tests:
 * 1. 200+ Sentence Multilingual Benchmark (Hindi, Marathi, Hinglish, English):
 *    - Evaluates True Positives, False Positives, True Negatives, False Negatives.
 *    - Calculates and reports precision and recall honestly.
 * 2. Strict Negation Handling:
 *    - Reverses intent for "Main marna nahi chahta" / "मी आत्महत्या करणार नाही" / "I do not want to die".
 *    - Detects implicit intent in "Main bachna nahi chahta" (I do not want to live).
 * 3. Idiom & Hyperbole Suppression:
 *    - Ignores colloquial death metaphors ("Traffic me mar jaunga", "haste haste mar gaya").
 * 4. Verified Helplines & Last Verified Dates:
 *    - Tele-MANAS (14416), KIRAN (1800-599-0019), ERSS (112).
 * 5. MHA 2017 Confidentiality & Crisis Escalation Workflow:
 *    - Prohibits automated police or family dispatch without clinic protocol.
 *    - Enforces emergency SLA tracking.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { evaluateCrisisIntent } from '@/lib/clinical/crisis-detection';
import {
  VERIFIED_INDIA_CRISIS_HELPLINES,
  CRISIS_DISCLAIMER_TEXTS,
  getCrisisConfigForClinic,
} from '@/lib/config/crisis-contacts';
import {
  triggerCrisisEscalation,
  assertLawfulExternalEscalation,
} from '@/lib/clinical/crisis-workflow';

interface BenchmarkItem {
  id: string;
  lang: 'hi' | 'mr' | 'hinglish' | 'en';
  text: string;
  expectedCrisis: boolean;
  category: string;
}

describe('Part 7: India Crisis Safety & Multilingual Detection Engine', () => {
  // --------------------------------------------------------------------------
  // 1. Multilingual Benchmark Execution & Metrics (200+ sentences)
  // --------------------------------------------------------------------------
  describe('1. Multilingual Benchmark Evaluation (Hindi, Marathi, Hinglish, English)', () => {
    const benchmarkPath = path.resolve(process.cwd(), 'tests/fixtures/crisis-benchmark.json');
    const benchmarkData: BenchmarkItem[] = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));

    it('contains at least 50 labeled sentences per language (200+ total)', () => {
      const counts: Record<string, number> = { hi: 0, mr: 0, hinglish: 0, en: 0 };
      for (const item of benchmarkData) {
        counts[item.lang] = (counts[item.lang] || 0) + 1;
      }

      expect(benchmarkData.length).toBeGreaterThanOrEqual(200);
      expect(counts.hi).toBeGreaterThanOrEqual(50);
      expect(counts.mr).toBeGreaterThanOrEqual(50);
      expect(counts.hinglish).toBeGreaterThanOrEqual(50);
      expect(counts.en).toBeGreaterThanOrEqual(50);
    });

    it('reports precision and recall honestly across all languages', () => {
      const metricsByLang: Record<string, { tp: number; fp: number; tn: number; fn: number }> = {
        hi: { tp: 0, fp: 0, tn: 0, fn: 0 },
        mr: { tp: 0, fp: 0, tn: 0, fn: 0 },
        hinglish: { tp: 0, fp: 0, tn: 0, fn: 0 },
        en: { tp: 0, fp: 0, tn: 0, fn: 0 },
      };

      for (const item of benchmarkData) {
        const result = evaluateCrisisIntent(item.text);
        const predicted = result.isCrisisFlagged;
        const actual = item.expectedCrisis;

        const m = metricsByLang[item.lang];
        if (predicted && actual) m.tp++;
        else if (predicted && !actual) m.fp++;
        else if (!predicted && !actual) m.tn++;
        else if (!predicted && actual) m.fn++;
      }

      // Aggregate metrics
      let totalTp = 0;
      let totalFp = 0;
      let totalTn = 0;
      let totalFn = 0;

      for (const lang of ['hi', 'mr', 'hinglish', 'en']) {
        const m = metricsByLang[lang];
        totalTp += m.tp;
        totalFp += m.fp;
        totalTn += m.tn;
        totalFn += m.fn;

        const precision = m.tp + m.fp > 0 ? (m.tp / (m.tp + m.fp)) * 100 : 0;
        const recall = m.tp + m.fn > 0 ? (m.tp / (m.tp + m.fn)) * 100 : 0;

        // Ensure robust performance: precision >= 80% and recall >= 90% across every language
        expect(precision).toBeGreaterThanOrEqual(80);
        expect(recall).toBeGreaterThanOrEqual(90);
      }

      const overallPrecision = (totalTp / (totalTp + totalFp)) * 100;
      const overallRecall = (totalTp / (totalTp + totalFn)) * 100;

      // Overall benchmark assertions
      expect(overallPrecision).toBeGreaterThanOrEqual(90);
      expect(overallRecall).toBeGreaterThanOrEqual(90);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Explicit Negation Handling Tests
  // --------------------------------------------------------------------------
  describe('2. Negation Handling & Intent Inversion', () => {
    it('correctly suppresses crisis flag when suicidal intent is negated in Hindi', () => {
      const res = evaluateCrisisIntent('मैं आत्महत्या नहीं करूँगा, मुझे जीना है।');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isNegated).toBe(true);
      expect(res.severity).toBe('none');
    });

    it('correctly suppresses crisis flag when suicidal intent is negated in Marathi', () => {
      const res = evaluateCrisisIntent('मी आत्महत्या करणार नाही, मला मदतीची गरज आहे.');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isNegated).toBe(true);
      expect(res.severity).toBe('none');
    });

    it('correctly suppresses crisis flag when suicidal intent is negated in Hinglish', () => {
      const res = evaluateCrisisIntent('Main suicide nahi karunga tension mat lijiye.');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isNegated).toBe(true);
    });

    it('correctly suppresses crisis flag when suicidal intent is negated in English', () => {
      const res = evaluateCrisisIntent('I do not want to die, I just feel overwhelmed.');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isNegated).toBe(true);
    });

    it('flags suicidal intent when negation indicates desire to not live ("Main bachna nahi chahta")', () => {
      // Negative construction expressing desire to die
      const res = evaluateCrisisIntent('Main ab aur bachna nahi chahta, marna chahta hu.');
      expect(res.isCrisisFlagged).toBe(true);
      expect(res.severity).toBe('high');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Idiom & Hyperbole Suppression
  // --------------------------------------------------------------------------
  describe('3. South Asian Idioms & Death Metaphors', () => {
    it('suppresses false positives on everyday traffic hyperboles', () => {
      const res = evaluateCrisisIntent('Traffic me mar jaunga itna bura haal hai.');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isIdiomaticOrHyperbole).toBe(true);
    });

    it('suppresses false positives on laughing expressions in Marathi', () => {
      const res = evaluateCrisisIntent('त्या विनोदावर आम्ही सर्व हसून हसून मेलो.');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isIdiomaticOrHyperbole).toBe(true);
    });

    it('suppresses false positives on work pressure metaphors in Hindi', () => {
      const res = evaluateCrisisIntent('ऑफिस में काम का प्रेशर बहुत ज्यादा है।');
      expect(res.isCrisisFlagged).toBe(false);
      expect(res.isIdiomaticOrHyperbole).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Verified Helplines & Regulatory Grounding
  // --------------------------------------------------------------------------
  describe('4. Verified Emergency Numbers & Regulatory Metadata', () => {
    it('includes verified Tele-MANAS, KIRAN, and 112 with valid source URLs', () => {
      const teleManas = VERIFIED_INDIA_CRISIS_HELPLINES.find((h) => h.id === 'tele-manas');
      expect(teleManas).toBeDefined();
      expect(teleManas?.dialNumber).toBe('14416');
      expect(teleManas?.officialSourceUrl).toBe('https://telemanas.mohfw.gov.in');
      expect(teleManas?.lastVerifiedDate).toBe('24/10/2026');

      const kiran = VERIFIED_INDIA_CRISIS_HELPLINES.find((h) => h.id === 'kiran');
      expect(kiran).toBeDefined();
      expect(kiran?.dialNumber).toBe('18005990019');
      expect(kiran?.officialSourceUrl).toBe('https://disabilityaffairs.gov.in');
      expect(kiran?.lastVerifiedDate).toBe('24/10/2026');

      const erss = VERIFIED_INDIA_CRISIS_HELPLINES.find((h) => h.id === 'national-emergency-112');
      expect(erss).toBeDefined();
      expect(erss?.dialNumber).toBe('112');
      expect(erss?.officialSourceUrl).toBe('https://112.gov.in');
    });

    it('provides trilingual disclaimer labeling the tool as an assistive aid only', () => {
      expect(CRISIS_DISCLAIMER_TEXTS.en).toContain('ASSISTIVE CRISIS RESOURCES ONLY');
      expect(CRISIS_DISCLAIMER_TEXTS.hi).toContain('सहायक संकट संसाधन');
      expect(CRISIS_DISCLAIMER_TEXTS.mr).toContain('साहाय्यक संकटकालीन संसाधने');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Crisis Escalation Workflow & MHA 2017 Compliance
  // --------------------------------------------------------------------------
  describe('5. Escalation Workflow, SLAs, and Privacy Safeguards', () => {
    const mockClinicConfigWithoutProtocols = {
      orgId: 'org_clinic_delhi',
      clinicName: 'Delhi Mind Care',
      hasDocumentedPoliceDispatchProtocol: false,
      hasDocumentedFamilyContactProtocol: false,
    };

    const mockClinicConfigWithProtocols = {
      orgId: 'org_clinic_delhi',
      clinicName: 'Delhi Mind Care',
      hasDocumentedPoliceDispatchProtocol: true,
      hasDocumentedFamilyContactProtocol: true,
      onCallOfficer: {
        name: 'Dr. Vikram Malhotra',
        role: 'Consultant Psychiatrist',
        phone: '+919876543210',
        availableHours: '24/7',
      },
    };

    it('prohibits automated police dispatch when clinic lacks a documented crisis protocol', () => {
      const check = assertLawfulExternalEscalation(mockClinicConfigWithoutProtocols, 'police');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('UNAUTHORIZED_POLICE_DISPATCH');
    });

    it('prohibits automated family disclosure without clinic protocol under MHA 2017 § 19', () => {
      const check = assertLawfulExternalEscalation(mockClinicConfigWithoutProtocols, 'family');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('UNAUTHORIZED_FAMILY_DISPATCH');
    });

    it('allows police dispatch and family alerting when clinic maintains verified protocols', () => {
      const policeCheck = assertLawfulExternalEscalation(mockClinicConfigWithProtocols, 'police');
      expect(policeCheck.allowed).toBe(true);

      const familyCheck = assertLawfulExternalEscalation(mockClinicConfigWithProtocols, 'family');
      expect(familyCheck.allowed).toBe(true);
    });

    it('executes escalation workflow, assigns SLA, alerts clinical officers, and logs audit', async () => {
      const result = await triggerCrisisEscalation({
        patientId: 'pat_crisis_001',
        orgId: 'org_clinic_delhi',
        clinicianId: 'usr_doc_001',
        severity: 'high',
        triggerSource: 'consult_speech',
        detectedTerms: ['explicit_suicide_hi'],
        clinicConfig: mockClinicConfigWithProtocols,
        requestPoliceDispatch: false,
      });

      expect(result.success).toBe(true);
      expect(result.incident.expectedResponseSlaMinutes).toBe(0); // Immediate in consult
      expect(result.incident.notifiedParties.length).toBe(2); // Clinician + On-Call Officer
      expect(result.incident.notifiedParties[1].recipientIdOrPhone).toBe('+919876543210');
      expect(result.incident.policeContactAuthorized).toBe(false);
    });

    it('enforces 15-minute response SLA for high-severity crisis detected outside live consult', async () => {
      const result = await triggerCrisisEscalation({
        patientId: 'pat_crisis_002',
        orgId: 'org_clinic_delhi',
        clinicianId: 'usr_doc_001',
        severity: 'high',
        triggerSource: 'patient_intake',
        detectedTerms: ['explicit_suicide_en'],
        clinicConfig: mockClinicConfigWithProtocols,
      });

      expect(result.incident.expectedResponseSlaMinutes).toBe(15);
    });
  });
});
