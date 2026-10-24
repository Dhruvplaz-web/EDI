/**
 * SOAP Draft Storage Utility
 * 
 * HIPAA Security Rule & PHI Protection:
 * Storing unencrypted clinical notes / PHI in browser localStorage violates
 * data-at-rest encryption and persistent retention requirements on shared workstations.
 * 
 * This module ensures drafts are kept exclusively in browser `sessionStorage`
 * (isolated to the tab process, purged on tab closure) and actively cleared upon:
 * 1. Note finalization & signing
 * 2. User logout
 * 3. Inactivity / idle timeout
 */

export const SOAP_DRAFT_PREFIX = 'praxis_soap_draft_';

export interface SoapDraftData {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  [key: string]: unknown;
}

/**
 * Saves in-progress SOAP draft exclusively to sessionStorage.
 * Never writes to localStorage.
 */
export function saveSoapDraft(patientId: string, soap: SoapDraftData): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${SOAP_DRAFT_PREFIX}${patientId}`;
    window.sessionStorage.setItem(key, JSON.stringify(soap));
  } catch (err) {
    console.warn('[SOAP Draft Storage] Failed to autosave draft to sessionStorage:', err);
  }
}

/**
 * Loads SOAP draft from sessionStorage.
 * Also checks and actively purges any legacy persistent localStorage entries
 * to remediate historical PHI-at-rest violations.
 */
export function loadSoapDraft(patientId: string): SoapDraftData | null {
  if (typeof window === 'undefined') return null;

  const key = `${SOAP_DRAFT_PREFIX}${patientId}`;

  // Proactively purge legacy persistent storage
  try {
    if (window.localStorage.getItem(key)) {
      window.localStorage.removeItem(key);
      console.warn(`[SOAP Draft Storage] Purged legacy persistent localStorage draft for ${patientId}`);
    }
  } catch {
    // Ignore storage permission errors
  }

  try {
    const saved = window.sessionStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && (parsed.subjective || parsed.objective || parsed.assessment || parsed.plan)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[SOAP Draft Storage] Failed to load draft from sessionStorage:', err);
    return null;
  }
}

/**
 * Clears draft for a specific patient upon signing and archiving.
 */
export function clearSoapDraft(patientId: string): void {
  if (typeof window === 'undefined') return;
  const key = `${SOAP_DRAFT_PREFIX}${patientId}`;
  try {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears all clinical drafts across all patients.
 * Call this on user logout or session idle timeout.
 */
export function purgeAllSoapDraftsOnLogoutOrIdle(): void {
  if (typeof window === 'undefined') return;

  try {
    // Purge from sessionStorage
    const sessionKeysToDelete: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(SOAP_DRAFT_PREFIX)) {
        sessionKeysToDelete.push(k);
      }
    }
    for (const k of sessionKeysToDelete) {
      window.sessionStorage.removeItem(k);
    }

    // Purge any accidental localStorage keys
    const localKeysToDelete: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(SOAP_DRAFT_PREFIX)) {
        localKeysToDelete.push(k);
      }
    }
    for (const k of localKeysToDelete) {
      window.localStorage.removeItem(k);
    }
  } catch (err) {
    console.warn('[SOAP Draft Storage] Error during draft purge:', err);
  }
}
