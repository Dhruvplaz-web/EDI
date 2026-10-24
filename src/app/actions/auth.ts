'use server'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'
import { 
  createSignedSessionToken, 
  verifySignedSessionToken,
  revokeUserSessions, 
  type VerifiedSessionPayload,
  type UserRole
} from '@/lib/auth/session'

const MFA_REQUIRED_ROLES: UserRole[] = [
  'clinician',
  'clinical_director',
  'specialist',
  'nurse',
  'medical_assistant',
  'billing_admin',
  'clinic_manager',
  'it_support',
  'operations',
  'super_admin',
];

export async function createSession(idToken: string, _clientRoleIgnored?: string) {
  try {
    const expiresIn = 60 * 60 * 8 // 8 hours absolute limit
    let uid: string;
    let role: UserRole;
    let orgId: string;

    if (!adminAuth) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Admin Auth service is uninitialized');
      }
      if (process.env.ENABLE_DEV_LOGIN !== 'true') {
        return {
          success: false,
          error: 'Authentication failed: Firebase Admin Auth service uninitialized and dev login is disabled.',
        };
      }
      uid = 'dev_user_' + Date.now();
      role = 'patient';
      orgId = 'org_praxis_demo';
    } else {
      // Call verifyIdToken with checkRevoked=true
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      uid = decoded.uid;

      const claimRole = decoded.role as UserRole | undefined;
      const claimOrgId = decoded.orgId as string | undefined;

      const isDevBackdoor =
        process.env.NODE_ENV !== 'production' &&
        process.env.ENABLE_DEV_LOGIN === 'true';

      if (!claimRole || !claimOrgId) {
        if (!isDevBackdoor) {
          return {
            success: false,
            error: 'Missing mandatory custom claims: Verified token must contain both role and orgId claims.',
          };
        }
        role = claimRole || 'patient';
        orgId = claimOrgId || 'org_praxis_demo';
      } else {
        role = claimRole;
        orgId = claimOrgId;
      }

      // Enforce Firebase MFA for ALL staff roles in production or when ENFORCE_MFA=true
      const isMfaEnforced = process.env.NODE_ENV === 'production' || process.env.ENFORCE_MFA === 'true';
      if (isMfaEnforced && MFA_REQUIRED_ROLES.includes(role)) {
        const hasMfa = Boolean(decoded.firebase?.sign_in_second_factor);
        if (!hasMfa) {
          return {
            success: false,
            error: 'MFA_REQUIRED: Multi-Factor Authentication (TOTP/SMS) is mandatory for clinical and administrative staff.',
            code: 'MFA_REQUIRED',
          };
        }
      }
    }

    const sessionToken = await createSignedSessionToken({ uid, role, orgId }, expiresIn)
    const cookieStore = await cookies()
    
    // Set ONLY the cryptographically signed session cookie (A.4: user_role cookie removed)
    cookieStore.set('session', sessionToken, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })
    
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    console.error('Session creation failed:', msg);
    return { success: false, error: msg }
  }
}

export async function removeSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  if (sessionToken) {
    try {
      const verified = await verifySignedSessionToken(sessionToken)
      if (verified?.uid) {
        // Invalidate active session version in revocation registry (A.3)
        revokeUserSessions(verified.uid)
      }
    } catch {
      // Ignore token decode errors on logout
    }
  }
  cookieStore.delete('session')
}
