import { describe, it, expect, beforeEach } from 'vitest';
import enTranslations from '@/lib/i18n/translations/en.json';
import hiTranslations from '@/lib/i18n/translations/hi.json';
import mrTranslations from '@/lib/i18n/translations/mr.json';
import {
  formatDateIndian,
  formatTimeIndian,
  formatCurrencyIndian,
  formatNumberIndian,
} from '@/lib/i18n/formatters';
import {
  validateIndianMobile,
  sendPhoneOtp,
  verifyPhoneOtp,
  registerFamilyProfilesForPhone,
  clearPhoneOtpStoreForTesting,
} from '@/lib/auth/phone-otp';
import {
  formatDltMessage,
  validateNoClinicalDataInMessage,
} from '@/lib/notifications/dlt-templates';
import { evaluateNetworkQuality, calculateReconnectDelayMs } from '@/lib/webrtc/network-adaptation';

describe('Part 6: Language, Indian Local UX & Telecommunications Suite', () => {
  beforeEach(() => {
    clearPhoneOtpStoreForTesting();
  });

  // --------------------------------------------------------------------------
  // 1. i18n Translation Parity (§ 1: en vs hi vs mr)
  // --------------------------------------------------------------------------
  describe('1. Translation Parity (English, Hindi, Marathi)', () => {
    function extractKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys = keys.concat(extractKeys(value as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = extractKeys(enTranslations);
    const hiKeys = extractKeys(hiTranslations);
    const mrKeys = extractKeys(mrTranslations);

    it('asserts that English dictionary has comprehensive coverage (>40 keys)', () => {
      expect(enKeys.length).toBeGreaterThan(40);
    });

    it('fails if ANY key in en.json is missing from Hindi translation (hi.json)', () => {
      const missingInHindi = enKeys.filter((k) => !hiKeys.includes(k));
      expect(missingInHindi).toEqual([]);
    });

    it('fails if ANY key in en.json is missing from Marathi translation (mr.json)', () => {
      const missingInMarathi = enKeys.filter((k) => !mrKeys.includes(k));
      expect(missingInMarathi).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Indian Localization Formatters (IST, DD/MM/YYYY, ₹ Lakh/Crore)
  // --------------------------------------------------------------------------
  describe('2. Indian Localization Formatters', () => {
    it('formats dates in DD/MM/YYYY according to Indian Standard Time (IST)', () => {
      // 2026-10-24 10:00 UTC -> 15:30 IST (+05:30)
      const date = new Date('2026-10-24T10:00:00Z');
      const formattedDate = formatDateIndian(date);
      expect(formattedDate).toBe('24/10/2026');

      const formattedTime = formatTimeIndian(date);
      expect(formattedTime).toContain('03:30 PM IST');
    });

    it('formats currency in INR with ₹ symbol and Indian numbering system (Lakh/Crore)', () => {
      // Standard comma notation
      expect(formatNumberIndian(150000)).toBe('1,50,000');
      expect(formatCurrencyIndian(150000)).toBe('₹1,50,000');

      // Lakh and Crore word formatting
      expect(formatCurrencyIndian(250000, true)).toBe('₹2.5 Lakh');
      expect(formatCurrencyIndian(15000000, true)).toBe('₹1.5 Crore');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Indian Phone OTP (+91) & Shared Family Phone Handling
  // --------------------------------------------------------------------------
  describe('3. Phone OTP (+91) & Shared Family Phone Engine', () => {
    it('validates 10-digit Indian mobile numbers with +91 prefixes', () => {
      // Valid numbers
      expect(validateIndianMobile('+91 98765 43210').isValid).toBe(true);
      expect(validateIndianMobile('9876543210').isValid).toBe(true);
      expect(validateIndianMobile('+91-8765432109').isValid).toBe(true);
      expect(validateIndianMobile('7012345678').isValid).toBe(true);

      // Invalid numbers (starting with 1-5, or not 10 digits)
      expect(validateIndianMobile('1234567890').isValid).toBe(false);
      expect(validateIndianMobile('+1 555 123 4567').isValid).toBe(false);
      expect(validateIndianMobile('98765').isValid).toBe(false);
    });

    it('enforces rate limiting: rejects excessive OTP requests beyond 3 per window', async () => {
      const phone = '+91 98765 43210';

      // 3 attempts succeed
      const res1 = await sendPhoneOtp(phone);
      expect(res1.success).toBe(true);
      const res2 = await sendPhoneOtp(phone);
      expect(res2.success).toBe(true);
      const res3 = await sendPhoneOtp(phone);
      expect(res3.success).toBe(true);

      // 4th attempt in rapid succession fails with rate limit error
      const res4 = await sendPhoneOtp(phone);
      expect(res4.success).toBe(false);
      expect(res4.error).toContain('RATE_LIMIT_EXCEEDED');
    });

    it('handles shared family phones by returning all registered family patient profiles', async () => {
      const familyPhone = '+91 98200 11223';

      // Register shared family profiles under this one phone number
      registerFamilyProfilesForPhone(familyPhone, [
        {
          id: 'pat_rajesh_father',
          name: 'Rajesh Kulkarni (Father)',
          ageYears: 48,
          gender: 'male',
          relationshipToAccountHolder: 'self',
          isMinor: false,
        },
        {
          id: 'pat_aarav_son',
          name: 'Aarav Kulkarni (Son)',
          ageYears: 14,
          gender: 'male',
          relationshipToAccountHolder: 'child',
          isMinor: true,
        },
      ]);

      // Request and send OTP
      const otpSend = await sendPhoneOtp(familyPhone);
      expect(otpSend.success).toBe(true);
      const mockOtp = otpSend.mockOtp || '778899';

      // Verify OTP
      const verifyRes = await verifyPhoneOtp({ phone: familyPhone, otp: mockOtp });
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.requiresProfileSelection).toBe(true);
      expect(verifyRes.profiles?.length).toBe(2);
      expect(verifyRes.profiles?.[1].name).toContain('Aarav Kulkarni');
      expect(verifyRes.profiles?.[1].isMinor).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. TRAI DLT Notifications & Zero Clinical PHI Leakage
  // --------------------------------------------------------------------------
  describe('4. TRAI DLT Registered SMS Notifications & Zero PHI Egress', () => {
    it('formats registered DLT notification messages with valid template variables', () => {
      const msg = formatDltMessage({
        templateType: 'APPOINTMENT_CONFIRMATION',
        language: 'en',
        variables: ['Dr. Sarah Jenkins', '24/10/2026', '04:00 PM', 'https://app.praxis-ai.in'],
      });

      expect(msg.header).toBe('PRXMED');
      expect(msg.templateId).toMatch(/^DLT_/);
      expect(msg.text).toContain('Dr. Sarah Jenkins');
      expect(msg.text).toContain('24/10/2026');
    });

    it('blocks notification generation if sensitive clinical terms or diagnoses are included', () => {
      // Attempting to include psychiatric diagnosis in unencrypted SMS
      expect(() =>
        formatDltMessage({
          templateType: 'APPOINTMENT_CONFIRMATION',
          language: 'en',
          variables: ['Dr. Sarah Jenkins for Severe Depression', '24/10/2026', '04:00 PM', 'https://app.praxis-ai.in'],
        })
      ).toThrow(/CLINICAL_PRIVACY_VIOLATION/);

      // Direct clinical leakage check
      const check = validateNoClinicalDataInMessage('Your prescription for Sertraline is ready.');
      expect(check.isValid).toBe(false);
      expect(check.violation?.toLowerCase()).toContain('sertraline');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Low-Bandwidth Mode & Network Adaptation
  // --------------------------------------------------------------------------
  describe('5. Low-Bandwidth Mode & WebRTC Adaptation', () => {
    it('automatically switches to audio-only fallback when bandwidth drops below 150 kbps', () => {
      // Extreme low bandwidth (80 kbps) -> Audio Only
      const lowBandwidthState = evaluateNetworkQuality(80);
      expect(lowBandwidthState.isAudioOnly).toBe(true);
      expect(lowBandwidthState.quality).toBe('poor');
      expect(lowBandwidthState.userAdvice.toLowerCase()).toContain('audio');

      // Moderate bandwidth (350 kbps) -> 240p video
      const moderateState = evaluateNetworkQuality(350);
      expect(moderateState.isAudioOnly).toBe(false);
      expect(moderateState.videoConstraints.height.max).toBe(240);

      // High bandwidth (1200 kbps) -> 720p HD video
      const hdState = evaluateNetworkQuality(1200);
      expect(hdState.isAudioOnly).toBe(false);
      expect(hdState.videoConstraints.height.max).toBe(720);
    });

    it('calculates exponential backoff delays for reconnection attempts', () => {
      expect(calculateReconnectDelayMs(1)).toBe(1000);
      expect(calculateReconnectDelayMs(2)).toBe(2000);
      expect(calculateReconnectDelayMs(3)).toBe(4000);
      expect(calculateReconnectDelayMs(4)).toBe(8000);
      expect(calculateReconnectDelayMs(5)).toBe(10000); // Capped at 10s
    });
  });
});
