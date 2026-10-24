'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { verifySignedSessionToken } from '@/lib/auth/session';
import {
  generateTotpSecret,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyAndRedeemRecoveryCode,
} from '@/lib/auth/mfa';

/**
 * Initiates TOTP MFA enrollment for the currently authenticated staff user.
 * Generates Base32 secret, otpauth URI, and 8 backup recovery codes.
 */
export async function initiateMfaEnrollment() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    return { success: false, error: 'Unauthorized: Session required for MFA enrollment.' };
  }

  const payload = await verifySignedSessionToken(sessionToken);
  if (!payload) {
    return { success: false, error: 'Unauthorized: Invalid or expired session.' };
  }

  const { secret, otpAuthUri } = generateTotpSecret(payload.uid);
  const recoveryCodes = generateRecoveryCodes(8);

  return {
    success: true,
    secret,
    otpAuthUri,
    recoveryCodes,
  };
}

/**
 * Confirms MFA enrollment after the user types their first 6-digit TOTP code.
 * Hashes recovery codes and persists enrollment record to Firestore.
 */
export async function confirmMfaEnrollment(
  secret: string,
  verificationCode: string,
  recoveryCodes: string[]
) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    return { success: false, error: 'Unauthorized: Session required.' };
  }

  const payload = await verifySignedSessionToken(sessionToken);
  if (!payload) {
    return { success: false, error: 'Unauthorized: Invalid or expired session.' };
  }

  const isValid = verifyTotpCode(secret, verificationCode);
  if (!isValid) {
    return { success: false, error: 'Invalid verification code. Please check your authenticator app.' };
  }

  // Hash recovery codes before persistence
  const hashedRecoveryCodes = recoveryCodes.map(hashRecoveryCode);

  if (adminDb) {
    try {
      await adminDb.collection('mfa_enrollments').doc(payload.uid).set({
        uid: payload.uid,
        orgId: payload.orgId,
        totpSecret: secret,
        hashedRecoveryCodes,
        enrolledAt: new Date().toISOString(),
        enabled: true,
      });

      // Update Firebase Auth user custom claims or flag if adminAuth is available
      if (adminAuth) {
        const userRecord = await adminAuth.getUser(payload.uid);
        const existingClaims = userRecord.customClaims || {};
        await adminAuth.setCustomUserClaims(payload.uid, {
          ...existingClaims,
          mfaEnrolled: true,
        });
      }
    } catch (err) {
      console.error('[MFA Enrollment Error]:', err);
      return { success: false, error: 'Failed to save MFA enrollment record.' };
    }
  }

  return { success: true };
}

/**
 * Redeems a one-time emergency recovery code for account access when device is lost.
 */
export async function redeemMfaRecoveryCodeAction(uid: string, recoveryCode: string) {
  if (!adminDb) {
    return { success: false, error: 'Database service unavailable.' };
  }

  try {
    const enrollmentRef = adminDb.collection('mfa_enrollments').doc(uid);
    const docSnap = await enrollmentRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'No MFA enrollment found for this user.' };
    }

    const data = docSnap.data();
    const storedHashedCodes: string[] = data?.hashedRecoveryCodes || [];

    const redemptionResult = verifyAndRedeemRecoveryCode(recoveryCode, storedHashedCodes);
    if (!redemptionResult.success) {
      return { success: false, error: 'Invalid or already-used recovery code.' };
    }

    await enrollmentRef.update({
      hashedRecoveryCodes: redemptionResult.remainingHashedCodes,
      lastRecoveryRedeemedAt: new Date().toISOString(),
    });

    return {
      success: true,
      remainingCodesCount: redemptionResult.remainingHashedCodes.length,
    };
  } catch (err) {
    console.error('[MFA Recovery Error]:', err);
    return { success: false, error: 'Failed to process recovery code.' };
  }
}
