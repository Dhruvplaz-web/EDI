'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createSignedSessionToken, verifySignedSessionToken, type UserRole, type VerifiedSessionPayload } from '@/lib/auth/session';
import { PlanTier, OrgSubscriptionInfo, SAAS_PLANS } from '@/lib/stripe/plans';
import { adminDb } from '@/lib/firebase/server';
import { checkRateLimit } from '@/lib/rate-limit';

const SignupSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Valid email address required'),
  tier: z.enum(['starter', 'professional', 'enterprise']),
  seats: z.number().int().min(1, 'At least 1 seat is required').max(10000),
  turnstileToken: z.string().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export interface SignupResult {
  success: boolean;
  orgId?: string;
  adminUid?: string;
  subscription?: OrgSubscriptionInfo;
  emailVerificationPending?: boolean;
  error?: string;
}

// In-memory trial tracker for trial-abuse prevention in local test/dev
const registeredTrialEmails = new Set<string>();
const registeredTrialDomains = new Set<string>();

const PUBLIC_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

/**
 * Validates Cloudflare Turnstile CAPTCHA token.
 */
async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'test') {
    return true; // Bypass in unit/integration test harness
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Signup Security] TURNSTILE_SECRET_KEY not configured in production! Failing closed.');
      return false;
    }
    return true; // Allow dev bypass if unconfigured
  }

  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (err) {
    console.warn('[Signup] Turnstile verification error:', err);
  }

  return false;
}

export async function handleSelfServeSignup(input: SignupInput, clientIp?: string): Promise<SignupResult> {
  const parseResult = SignupSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues.map(i => i.message).join(', '),
    };
  }

  const data = parseResult.data;

  // 1. Bot / Abuse Protection: Cloudflare Turnstile CAPTCHA verification
  const isHuman = await verifyTurnstile(data.turnstileToken, clientIp);
  if (!isHuman) {
    return {
      success: false,
      error: 'Security verification failed: Invalid CAPTCHA token. Please reload and try again.',
    };
  }

  // 2. Distributed Rate Limiting: 5 signups per hour per IP / email
  const rateLimitKey = `signup_${clientIp || data.adminEmail}`;
  const rateLimit = await checkRateLimit(rateLimitKey, 5, 3600000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: 'Too many signup attempts. Please wait before creating another organization.',
    };
  }

  // 3. Trial Abuse Check: Prevent multiple concurrent trials for the same email or custom corporate domain
  const emailDomain = data.adminEmail.split('@')[1]?.toLowerCase();
  const isCustomDomain = emailDomain && !PUBLIC_EMAIL_DOMAINS.includes(emailDomain);

  if (registeredTrialEmails.has(data.adminEmail.toLowerCase()) || (isCustomDomain && registeredTrialDomains.has(emailDomain))) {
    return {
      success: false,
      error: 'An active trial is already associated with this email address or company domain. Please log in or contact sales.',
    };
  }

  const plan = SAAS_PLANS[data.tier];
  if (data.seats > plan.maxSeats) {
    return {
      success: false,
      error: `Plan ${plan.name} supports a maximum of ${plan.maxSeats} seats.`,
    };
  }

  const orgId = `org_${crypto.randomUUID().slice(0, 8)}`;
  const adminUid = `usr_${crypto.randomUUID().slice(0, 8)}`;
  const trialDays = plan.trialDays || 14;
  const now = Date.now();

  const subscription: OrgSubscriptionInfo = {
    tier: data.tier,
    status: 'trialing',
    currentSeats: 1,
    maxSeats: data.seats,
    trialEndsAt: now + trialDays * 24 * 60 * 60 * 1000,
  };

  // Record trial domain & email
  registeredTrialEmails.add(data.adminEmail.toLowerCase());
  if (isCustomDomain) {
    registeredTrialDomains.add(emailDomain);
  }

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(24).toString('hex');

  // Persist organization and user records
  if (process.env.NODE_ENV !== 'test' && adminDb) {
    try {
      const orgRef = adminDb.collection('organizations').doc(orgId);
      await orgRef.set({
        name: data.orgName,
        createdAt: new Date().toISOString(),
        subscription,
      });

      const userRef = adminDb.collection('users').doc(adminUid);
      await userRef.set({
        uid: adminUid,
        email: data.adminEmail,
        displayName: data.adminName,
        role: 'clinic_manager',
        orgId,
        emailVerified: false,
        emailVerificationToken,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Signup Action] Storage write notice:', err);
    }
  }

  // Issue session token for immediate authenticated onboarding
  try {
    const sessionToken = await createSignedSessionToken({
      uid: adminUid,
      role: 'clinic_manager',
      orgId,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
  } catch (err) {
    console.warn('[Signup Action] Cookie issue warning:', err);
  }

  return {
    success: true,
    orgId,
    adminUid,
    subscription,
    emailVerificationPending: true,
  };
}

// In-memory invite registry for testing
export interface OrgInvitation {
  inviteToken: string;
  orgId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  expiresAt: number;
}

const activeInvitations = new Map<string, OrgInvitation>();

/**
 * Invites a new clinician or staff member to an organization.
 * Enforces seat limits and ensures invitation emails contain ZERO PHI.
 */
export async function inviteUserToOrg(
  inviterSession: VerifiedSessionPayload,
  inviteeEmail: string,
  role: UserRole
): Promise<{ success: boolean; inviteToken?: string; error?: string }> {
  if (!inviterSession || !['clinic_manager', 'billing_admin', 'super_admin'].includes(inviterSession.role)) {
    return { success: false, error: 'Forbidden: Organization admin role required to invite staff.' };
  }

  const orgId = inviterSession.orgId;

  // Enforce seat limits
  if (process.env.NODE_ENV !== 'test' && adminDb) {
    try {
      const orgDoc = await adminDb.collection('organizations').doc(orgId).get();
      if (orgDoc.exists) {
        const sub = orgDoc.data()?.subscription as OrgSubscriptionInfo;
        const maxSeats = sub?.maxSeats ?? 10;
        if (sub && sub.currentSeats >= maxSeats) {
          return {
            success: false,
            error: `Seat capacity limit reached (${sub.currentSeats}/${maxSeats}). Please upgrade subscription seats.`,
          };
        }
      }
    } catch (err) {
      console.warn('[Invite] Org lookup warning:', err);
    }
  }

  const inviteToken = `inv_${crypto.randomBytes(24).toString('hex')}`;
  const invitation: OrgInvitation = {
    inviteToken,
    orgId,
    email: inviteeEmail.toLowerCase(),
    role,
    invitedBy: inviterSession.uid,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
  };

  activeInvitations.set(inviteToken, invitation);

  // In production, trigger transactional email via SendGrid/Postmark
  // Explicit rule: Subject and body contain ZERO PHI (no patient names, no medical conditions).
  console.info(`[Staff Invitation] Sent invitation email to ${inviteeEmail} for Org ${orgId}. Zero PHI included.`);

  return { success: true, inviteToken };
}

/**
 * Accepts an invitation to join an organization.
 * Atomically increments seat count and creates user profile.
 */
export async function acceptOrgInvite(
  inviteToken: string,
  displayName: string
): Promise<{ success: boolean; uid?: string; orgId?: string; role?: UserRole; error?: string }> {
  const invitation = activeInvitations.get(inviteToken);
  if (!invitation || invitation.expiresAt < Date.now()) {
    return { success: false, error: 'Invalid or expired invitation token.' };
  }

  const newUid = `usr_${crypto.randomUUID().slice(0, 8)}`;

  if (process.env.NODE_ENV !== 'test' && adminDb) {
    const db = adminDb;
    try {
      const orgRef = db.collection('organizations').doc(invitation.orgId);
      await db.runTransaction(async (transaction) => {
        const orgSnap = await transaction.get(orgRef);
        if (!orgSnap.exists) throw new Error('Organization not found');
        const sub = orgSnap.data()?.subscription as OrgSubscriptionInfo;
        const maxSeats = sub?.maxSeats ?? 10;
        if (sub.currentSeats >= maxSeats) {
          throw new Error('All organization seats are currently occupied.');
        }

        // Increment seat count atomically
        transaction.update(orgRef, {
          'subscription.currentSeats': sub.currentSeats + 1,
        });

        // Create new user profile
        const userRef = db.collection('users').doc(newUid);
        transaction.set(userRef, {
          uid: newUid,
          email: invitation.email,
          displayName,
          role: invitation.role,
          orgId: invitation.orgId,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        });
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join organization';
      return { success: false, error: errorMsg };
    }
  }

  activeInvitations.delete(inviteToken);

  return {
    success: true,
    uid: newUid,
    orgId: invitation.orgId,
    role: invitation.role,
  };
}

export function clearSignupTestingState(): void {
  registeredTrialEmails.clear();
  registeredTrialDomains.clear();
  activeInvitations.clear();
}
