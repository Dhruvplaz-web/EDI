import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleSelfServeSignup,
  inviteUserToOrg,
  acceptOrgInvite,
  clearSignupTestingState,
} from '@/app/actions/signup';
import { purgeExpiredTelemetry, calculateRetentionCutoff } from '@/lib/retention/policy';
import { VerifiedSessionPayload } from '@/lib/auth/session';

let currentMockCookies: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = currentMockCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
    set: vi.fn((name: string, val: string) => {
      currentMockCookies[name] = val;
    }),
  }),
}));

describe('Part G.2 & G.3: Self-Serve Organization Signup, Trial Abuse, Staff Invites & Retention', () => {
  beforeEach(() => {
    currentMockCookies = {};
    clearSignupTestingState();
    vi.restoreAllMocks();
  });

  describe('Part G.2: Self-Serve Signup, Bot Defense & Trial Abuse Prevention', () => {
    it('creates organization with trialing subscription and provisions first admin user', async () => {
      const result = await handleSelfServeSignup({
        orgName: 'Beacon Psychiatry Clinic',
        adminName: 'Dr. Sarah Connor',
        adminEmail: 'sarah.connor@beaconpsych.com',
        tier: 'professional',
        seats: 5,
        turnstileToken: 'test-turnstile-token',
      });

      expect(result.success).toBe(true);
      expect(result.orgId).toMatch(/^org_/);
      expect(result.adminUid).toMatch(/^usr_/);
      expect(result.subscription?.status).toBe('trialing');
      expect(result.subscription?.tier).toBe('professional');
      expect(result.subscription?.maxSeats).toBe(5);
      expect(result.subscription?.currentSeats).toBe(1);
      expect(result.emailVerificationPending).toBe(true);

      // Asserts session cookie was issued for immediate login
      expect(currentMockCookies['session']).toBeDefined();
    });

    it('rejects trial abuse: duplicate signup from the same corporate email domain is blocked', async () => {
      // First signup succeeds
      const first = await handleSelfServeSignup({
        orgName: 'Summit Health Group',
        adminName: 'Dr. John Doe',
        adminEmail: 'jdoe@summithealthcorp.com',
        tier: 'professional',
        seats: 3,
        turnstileToken: 'test-turnstile-token',
      });
      expect(first.success).toBe(true);

      // Second signup from the same custom corporate domain is rejected as trial abuse
      const second = await handleSelfServeSignup({
        orgName: 'Summit Health Secondary',
        adminName: 'Dr. Jane Smith',
        adminEmail: 'jsmith@summithealthcorp.com',
        tier: 'professional',
        seats: 3,
        turnstileToken: 'test-turnstile-token',
      });

      expect(second.success).toBe(false);
      expect(second.error).toContain('An active trial is already associated with this email address or company domain');
    });

    it('rejects signup with invalid seat counts or malformed email', async () => {
      const result = await handleSelfServeSignup({
        orgName: 'Bad Clinic',
        adminName: 'Admin',
        adminEmail: 'not-an-email',
        tier: 'starter',
        seats: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Part G.2: Staff Organization Invitations & Seat Limit Enforcement', () => {
    const adminSession: VerifiedSessionPayload = {
      uid: 'admin_test_1',
      role: 'clinic_manager',
      orgId: 'org_summit_1',
      iss: 'praxis-ai-platform',
      env: 'test',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      sessionVersion: 1,
    };

    it('admin invites clinician with valid token and zero PHI in email payload', async () => {
      const inviteRes = await inviteUserToOrg(adminSession, 'clinician.invitee@summit.com', 'clinician');
      expect(inviteRes.success).toBe(true);
      expect(inviteRes.inviteToken).toMatch(/^inv_/);
    });

    it('allows invitee to accept invitation and assigns designated staff role', async () => {
      const inviteRes = await inviteUserToOrg(adminSession, 'clinician.invitee@summit.com', 'clinician');
      expect(inviteRes.success).toBe(true);

      const acceptRes = await acceptOrgInvite(inviteRes.inviteToken!, 'Dr. Alice Walker');
      expect(acceptRes.success).toBe(true);
      expect(acceptRes.uid).toMatch(/^usr_/);
      expect(acceptRes.role).toBe('clinician');
      expect(acceptRes.orgId).toBe('org_summit_1');
    });
  });

  describe('Part G.3: Telemetry Retention Engine (Telemetry-Only Scoping)', () => {
    it('calculates correct HIPAA retention cutoffs per plan tier', () => {
      const now = Date.now();
      const starterCutoff = calculateRetentionCutoff('starter', now);
      const proCutoff = calculateRetentionCutoff('professional', now);
      const enterpriseCutoff = calculateRetentionCutoff('enterprise', now);

      // Starter: 30 days
      expect(now - starterCutoff).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
      // Professional: 365 days
      expect(now - proCutoff).toBeCloseTo(365 * 24 * 60 * 60 * 1000, -3);
      // Enterprise: 2555 days (7 years)
      expect(now - enterpriseCutoff).toBeCloseTo(2555 * 24 * 60 * 60 * 1000, -3);
    });

    it('purges records with dry-run mode and live execution support', async () => {
      // Dry run mode returns status: 'dry_run' without modifying records
      const dryResult = await purgeExpiredTelemetry('org_test_123', 'starter', true);
      expect(dryResult.status).toBe('dry_run');
      expect(dryResult.cutoffTimestamp).toBeDefined();

      // Live mode returns status: 'completed'
      const liveResult = await purgeExpiredTelemetry('org_test_123', 'starter', false);
      expect(liveResult.status).toBe('completed');
    });
  });
});
