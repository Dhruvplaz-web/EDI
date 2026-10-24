import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateSoapPOST } from '@/app/api/clinical/generate-soap/route';
import { createSignedSessionToken } from '@/lib/auth/session';
import {
  getOrgFeatureFlags,
  updateOrgFeatureFlags,
  setMockOrgFeatureFlags,
  clearMockOrgFeatureFlags,
  DEFAULT_ORG_FEATURE_FLAGS,
} from '@/lib/config/feature-flags';
import { recordPatientConsent, clearConsentStoreForTesting } from '@/lib/consent/consent-store';

let currentMockCookies: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = currentMockCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
    set: vi.fn(),
  }),
}));

describe('Part 1: India Regulatory Feature Flags & Research Mode Enforcement', () => {
  beforeEach(() => {
    currentMockCookies = {};
    clearMockOrgFeatureFlags();
    clearConsentStoreForTesting();
    vi.restoreAllMocks();
  });

  it('1. Default configuration: all clinical AI and biomarker flags are OFF by default', async () => {
    const flags = await getOrgFeatureFlags('org_mumbai_psychiatry');
    expect(flags).toEqual(DEFAULT_ORG_FEATURE_FLAGS);
    expect(flags.biomarkerScores).toBe(false);
    expect(flags.discrepancyAlerts).toBe(false);
    expect(flags.aiNoteDrafting).toBe(false);
    expect(flags.researchMode).toBe(false);
  });

  it('2. Normal organization cannot call AI generate-soap endpoint (blocked with 403)', async () => {
    const clinicianToken = await createSignedSessionToken({
      uid: 'dr_sharma_mumbai',
      role: 'clinician',
      orgId: 'org_mumbai_psychiatry',
    });
    currentMockCookies['session'] = clinicianToken;

    await recordPatientConsent({
      patientId: 'PAT-INDIA-01',
      orgId: 'org_mumbai_psychiatry',
      scope: ['voice_telemetry', 'facial_kinematics', 'ai_documentation'],
      policyVersion: 'v2.0',
      timestamp: Date.now(),
    });

    const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'PAT-INDIA-01',
        patientName: 'Aarav Patel',
        primaryDiagnosis: 'Major Depressive Episode',
        subjectiveScore: 6.0,
      }),
    });

    const res = await generateSoapPOST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FEATURE_DISABLED_AI_NOTE_DRAFTING');
    expect(body.error).toMatch(/Ethics Committee.*approval/i);
  });

  it('3. Non-super_admin cannot enable research mode or feature flags', async () => {
    const result = await updateOrgFeatureFlags(
      'org_mumbai_psychiatry',
      { researchMode: true },
      { uid: 'dr_sharma_mumbai', role: 'clinician' },
      {
        ethicsApprovalRef: 'IEC/NIMHANS/2026/042',
        approvalDate: '2026-03-15',
        approvalDocUrl: 'https://storage.india.health/docs/iec-042.pdf',
        signedResearchAgreement: true,
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/super_admin/i);
    const flags = await getOrgFeatureFlags('org_mumbai_psychiatry');
    expect(flags.researchMode).toBe(false);
  });

  it('4. Enabling research mode fails if Ethics Committee approval reference is missing', async () => {
    const result = await updateOrgFeatureFlags(
      'org_mumbai_psychiatry',
      { researchMode: true },
      { uid: 'superadmin_1', role: 'super_admin' },
      {
        ethicsApprovalRef: '', // Missing
        approvalDate: '2026-03-15',
        approvalDocUrl: 'https://storage.india.health/docs/iec-042.pdf',
        signedResearchAgreement: true,
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Ethics Committee approval reference/i);
  });

  it('5. Enabling research mode fails if signed research agreement flag is false', async () => {
    const result = await updateOrgFeatureFlags(
      'org_mumbai_psychiatry',
      { researchMode: true },
      { uid: 'superadmin_1', role: 'super_admin' },
      {
        ethicsApprovalRef: 'IEC/AIIMS/2026/099',
        approvalDate: '2026-04-01',
        approvalDocUrl: 'https://storage.india.health/docs/aiims-099.pdf',
        signedResearchAgreement: false, // Unsigned
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/signed/i);
  });

  it('6. Super-admin can successfully enable research mode with complete documentation', async () => {
    const result = await updateOrgFeatureFlags(
      'org_mumbai_psychiatry',
      {
        researchMode: true,
        aiNoteDrafting: true,
        biomarkerScores: true,
        discrepancyAlerts: true,
      },
      { uid: 'superadmin_1', role: 'super_admin' },
      {
        ethicsApprovalRef: 'IEC/NIMHANS/2026/042',
        approvalDate: '2026-03-15',
        approvalDocUrl: 'https://storage.india.health/docs/iec-042.pdf',
        signedResearchAgreement: true,
      }
    );

    expect(result.success).toBe(true);
    expect(result.flags.researchMode).toBe(true);
    expect(result.flags.aiNoteDrafting).toBe(true);
    expect(result.flags.biomarkerScores).toBe(true);
    expect(result.flags.discrepancyAlerts).toBe(true);
  });

  it('7. In research mode, SOAP generation succeeds with RUO disclaimer and research flag', async () => {
    // Mock research mode active for this organization
    setMockOrgFeatureFlags('org_research_aiims', {
      researchMode: true,
      aiNoteDrafting: true,
      biomarkerScores: true,
      discrepancyAlerts: true,
    });

    const clinicianToken = await createSignedSessionToken({
      uid: 'dr_mukherjee_aiims',
      role: 'clinician',
      orgId: 'org_research_aiims',
    });
    currentMockCookies['session'] = clinicianToken;

    await recordPatientConsent({
      patientId: 'PAT-RESEARCH-AIIMS-01',
      orgId: 'org_research_aiims',
      scope: ['voice_telemetry', 'facial_kinematics', 'ai_documentation'],
      policyVersion: 'v2.0',
      timestamp: Date.now(),
    });

    const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'PAT-RESEARCH-AIIMS-01',
        patientName: 'Priya Sharma',
        primaryDiagnosis: 'Generalized Anxiety Disorder',
        subjectiveScore: 7.2,
        emaStress: 6.8,
        rFrown: 0.45,
        speechJitter: 1.2,
        discrepancyD: 2.4,
        discrepancyAlert: true,
      }),
    });

    const res = await generateSoapPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isResearchNote).toBe(true);
    expect(body.disclaimer).toMatch(/Research use only/i);
    expect(body.disclaimer).toMatch(/Not for diagnosis or treatment decisions/i);
  });
});
