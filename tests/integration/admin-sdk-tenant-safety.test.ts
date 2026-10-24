import { describe, it, expect, beforeEach } from 'vitest';
import { assertSameOrg, recordBreakGlassOverride, clearBreakGlassForTesting, TenantAccessError } from '@/lib/auth/tenant';
import { createSignedSessionToken, type VerifiedSessionPayload } from '@/lib/auth/session';
import { POST as generateSoapPOST } from '@/lib/../app/api/clinical/generate-soap/route';
import { NextRequest } from 'next/server';
import { issueConsentToken } from '@/lib/consent/consent-store';

describe('Part D: Admin SDK Tenant Safety & Platform Super Admin Policy', () => {
  beforeEach(() => {
    clearBreakGlassForTesting();
  });

  const clinicianOrgA: VerifiedSessionPayload = {
    uid: 'clinician_org_a',
    role: 'clinician',
    orgId: 'org_a',
    iss: 'praxis-ai-platform',
    env: 'test',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    sessionVersion: 1,
  };

  const clinicianOrgB: VerifiedSessionPayload = {
    uid: 'clinician_org_b',
    role: 'clinician',
    orgId: 'org_b',
    iss: 'praxis-ai-platform',
    env: 'test',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    sessionVersion: 1,
  };

  const superAdmin: VerifiedSessionPayload = {
    uid: 'super_admin_usr',
    role: 'super_admin',
    orgId: 'org_platform',
    iss: 'praxis-ai-platform',
    env: 'test',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    sessionVersion: 1,
  };

  it('assertSameOrg: allows access when caller org matches resource org', async () => {
    await expect(assertSameOrg(clinicianOrgA, 'org_a', 'pat_1')).resolves.toBeUndefined();
  });

  it('assertSameOrg: rejects cross-tenant access with 403 TenantAccessError', async () => {
    await expect(assertSameOrg(clinicianOrgA, 'org_b', 'pat_2')).rejects.toThrow(TenantAccessError);
  });

  it('assertSameOrg: platform super_admin is BLOCKED from PHI by default', async () => {
    // When no patientId is provided
    await expect(assertSameOrg(superAdmin, 'org_a')).rejects.toThrow(
      'Platform super_admin has no default PHI access'
    );

    // When patientId is provided without active break-glass override
    await expect(assertSameOrg(superAdmin, 'org_a', 'pat_1')).rejects.toThrow(
      'Active emergency break-glass override required'
    );
  });

  it('assertSameOrg: platform super_admin succeeds ONLY when audited break-glass is active', async () => {
    // Record audited emergency break-glass override
    await recordBreakGlassOverride({
      actorId: superAdmin.uid,
      actorRole: superAdmin.role,
      targetOrgId: 'org_a',
      patientId: 'pat_emergency_999',
      reason: 'Urgent crisis audit requested by clinical director',
      durationMinutes: 15,
    });

    // Now super_admin access to that specific patient succeeds
    await expect(assertSameOrg(superAdmin, 'org_a', 'pat_emergency_999')).resolves.toBeUndefined();

    // Access to any other patient remains blocked
    await expect(assertSameOrg(superAdmin, 'org_a', 'pat_other_patient')).rejects.toThrow();
  });
});
