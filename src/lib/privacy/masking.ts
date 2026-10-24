/**
 * Praxis AI - Data Minimization, PII Masking & Aadhaar Defense (DPDP Act 2023 § 8)
 * 
 * Enforces:
 * 1. ZERO collection of Aadhaar numbers or UID images (hard rejection).
 * 2. Optional ABHA (Ayushman Bharat Health Account) validation.
 * 3. Masking of Indian mobile numbers and emails for lists, logs, and public views.
 */

// Regex for 12-digit Indian Aadhaar number (with optional spaces or hyphens)
// Aadhaar does not start with 0 or 1
const AADHAAR_REGEX = /\b[2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/;

// Regex for Indian PAN card: 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;

// Regex for Indian Mobile Numbers (+91 or starting with 6, 7, 8, 9)
const INDIAN_PHONE_REGEX = /(?:\+91[\s-]?)?[6789]\d{9}\b/g;

// Regex for standard Email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Validates that an input string does not contain an Aadhaar number.
 * Throws or returns invalid if an Aadhaar pattern is detected.
 */
export function validateNoAadhaar(input: unknown): { isValid: boolean; error?: string } {
  if (typeof input !== 'string') {
    if (typeof input === 'object' && input !== null) {
      const serialized = JSON.stringify(input);
      if (AADHAAR_REGEX.test(serialized)) {
        return {
          isValid: false,
          error: 'AADHAAR_COLLECTION_PROHIBITED: Under DPDP Act data minimization and UIDAI rules, collecting Aadhaar numbers is prohibited.',
        };
      }
    }
    return { isValid: true };
  }

  if (AADHAAR_REGEX.test(input)) {
    return {
      isValid: false,
      error: 'AADHAAR_COLLECTION_PROHIBITED: Under DPDP Act data minimization and UIDAI rules, collecting Aadhaar numbers is prohibited.',
    };
  }

  return { isValid: true };
}

/**
 * Validates optional ABHA (Ayushman Bharat Health Account) number or address.
 * Format: 14-digit ABHA ID (e.g. 14-1234-5678-9012) or ABHA address (name@abdm)
 */
export function validateAbha(abha: string): { isValid: boolean; type?: 'id' | 'address'; error?: string } {
  if (!abha || abha.trim() === '') {
    return { isValid: true }; // ABHA is optional
  }

  const clean = abha.trim();
  const abhaIdRegex = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/;
  const abhaAddressRegex = /^[a-zA-Z0-9._-]+@(abdm|sbx)$/i;

  if (abhaIdRegex.test(clean)) {
    return { isValid: true, type: 'id' };
  }

  if (abhaAddressRegex.test(clean)) {
    return { isValid: true, type: 'address' };
  }

  return {
    isValid: false,
    error: 'Invalid ABHA format. Expected 14-digit ABHA Number (e.g. 14-1234-5678-9012) or ABHA address (e.g. username@abdm).',
  };
}

/**
 * Masks an Indian or international phone number for display in audit logs or admin lists.
 * E.g. "+91 9876543210" -> "+91 98****3210"
 * E.g. "9876543210" -> "98****3210"
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '***';

  const last4 = digits.slice(-4);
  const countryCode = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '';
  const first2 = digits.slice(digits.length - 10, digits.length - 8);

  return `${countryCode}${first2}****${last4}`;
}

/**
 * Masks an email address for display in audit logs or admin lists.
 * E.g. "dhruv.psychiatrist@delhiclinic.in" -> "d****t@delhiclinic.in"
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return '***';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}***@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}****${last}@${domain}`;
}

/**
 * Deeply scrubs PII from any payload (for logs and Sentry events).
 */
export function scrubPii(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return data
      .replace(AADHAAR_REGEX, '[REDACTED_AADHAAR]')
      .replace(PAN_REGEX, '[REDACTED_PAN]')
      .replace(INDIAN_PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  }

  if (Array.isArray(data)) {
    return data.map((item) => scrubPii(item));
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      // Directly redact sensitive clinical fields or direct identifiers
      if (
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('token')
      ) {
        cleaned[key] = '[REDACTED_SECRET]';
      } else if (lower.includes('aadhaar')) {
        cleaned[key] = '[REDACTED_AADHAAR]';
      } else if (lower.includes('pan')) {
        cleaned[key] = '[REDACTED_PAN]';
      } else if (
        lower.includes('soap') ||
        lower.includes('assessment') ||
        lower.includes('subjective') ||
        lower.includes('diagnostic')
      ) {
        cleaned[key] = '[REDACTED_CLINICAL_PHI]';
      } else {
        cleaned[key] = scrubPii(val);
      }
    }
    return cleaned;
  }

  return data;
}
