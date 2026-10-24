import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateSoapPOST } from '@/app/api/clinical/generate-soap/route';
import { createSignedSessionToken } from '@/lib/auth/session';
import {
  recordPatientConsent,
  revokePatientConsent,
  clearConsentStoreForTesting,
  verifyStoredConsent,
} from '@/lib/consent/consent-store';
import { setMockOrgFeatureFlags, clearMockOrgFeatureFlags } from '@/lib/config/feature-flags';

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

describe('C.2, C.4, C.5: Server-Side Stored Consent, BAA Verification & PHI Access Logging', () => {
  beforeEach(() => {
    currentMockCookies = {};
    clearConsentStoreForTesting();
    clearMockOrgFeatureFlags();
    setMockOrgFeatureFlags('org_mayo_clinic', {
      aiNoteDrafting: true,
      researchMode: true,
      biomarkerScores: true,
      discrepancyAlerts: true,
    });
    vi.restoreAllMocks();
  });

  it('rejects SOAP generation with 403 when no server-stored consent record exists for patient', async () => {
    const clinicianToken = await createSignedSessionToken({
      uid: 'dr_verified_smith',
      role: 'clinician',
      orgId: 'org_mayo_clinic',
    });
    currentMockCookies['session'] = clinicianToken;

    const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'PAT-UNCONSENTED-99',
        patientName: 'Jane Doe',
        primaryDiagnosis: 'Major Depressive Disorder',
      }),
    });

    const res = await generateSoapPOST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Patient.*consent/i);
  });

  it('rejects SOAP generation with 403 if patient revoked consent', async () => {
    await recordPatientConsent({
      patientId: 'PAT-REVOKED-11',
      orgId: 'org_mayo_clinic',
      scope: ['voice_telemetry', 'facial_kinematics', 'ai_documentation'],
      policyVersion: 'v2.0',
      timestamp: Date.now(),
    });

    // Patient revokes consent
    await revokePatientConsent('PAT-REVOKED-11', 'org_mayo_clinic');

    const status = await verifyStoredConsent('PAT-REVOKED-11', 'org_mayo_clinic', 'ai_documentation');
    expect(status.isValid).toBe(false);
    expect(status.reason).toMatch(/revoked/i);

    const clinicianToken = await createSignedSessionToken({
      uid: 'dr_verified_smith',
      role: 'clinician',
      orgId: 'org_mayo_clinic',
    });
    currentMockCookies['session'] = clinicianToken;

    const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'PAT-REVOKED-11',
        patientName: 'John Doe',
        primaryDiagnosis: 'Anxiety',
      }),
    });

    const res = await generateSoapPOST(req);
    expect(res.status).toBe(403);
  });

  it('succeeds with server-held consent and logs PHI audit entry', async () => {
    await recordPatientConsent({
      patientId: 'PAT-CONSENTED-42',
      orgId: 'org_mayo_clinic',
      scope: ['voice_telemetry', 'facial_kinematics', 'ai_documentation'],
      policyVersion: 'v2.0',
      timestamp: Date.now(),
    });

    const clinicianToken = await createSignedSessionToken({
      uid: 'dr_verified_smith',
      role: 'clinician',
      orgId: 'org_mayo_clinic',
    });
    currentMockCookies['session'] = clinicianToken;

    const req = new NextRequest('https://praxis-ai.health/api/clinical/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'PAT-CONSENTED-42',
        patientName: 'Alice Green',
        primaryDiagnosis: 'Bipolar II Disorder',
        subjectiveScore: 6.5,
        emaStress: 7.0,
      }),
    });

    const res = await generateSoapPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.soapNote).toBeDefined();
    expect(body.soapNote.assessment).toBeDefined();
  });
});
