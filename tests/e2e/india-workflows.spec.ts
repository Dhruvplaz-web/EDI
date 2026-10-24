import { test, expect } from '@playwright/test';
import { createSignedSessionToken } from '../../src/lib/auth/session';

test.describe('Part 9: Indian Clinical & Regulatory E2E Workflows', () => {
  // Mobile viewport testing (360px Android and 375px iPhone)
  test.use({ viewport: { width: 360, height: 740 } });

  // --------------------------------------------------------------------------
  // 1. Crisis Screen & Direct Helplines (/crisis)
  // --------------------------------------------------------------------------
  test('Crisis Screen: renders verified Indian helplines in English, Hindi, and Marathi on mobile 360px', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const res = await page.goto('/crisis');
    expect(res?.status()).toBe(200);

    // Verify 112 emergency dialer (first occurrence is top banner)
    const emergencyDial = page.locator('a[href="tel:112"]').first();
    await expect(emergencyDial).toBeVisible();

    // Verify Tele-MANAS (14416)
    const telemanasDial = page.locator('a[href="tel:14416"]').first();
    await expect(telemanasDial).toBeVisible();

    // Verify KIRAN (18005990019)
    const kiranDial = page.locator('a[href="tel:18005990019"]').first();
    await expect(kiranDial).toBeVisible();

    // Switch to Hindi
    const hiBtn = page.getByRole('button', { name: 'हिंदी' });
    await hiBtn.click();
    await expect(page.getByText('भारत मानसिक स्वास्थ्य संकट एवं आपातकालीन हेल्पलाइन')).toBeVisible();

    // Switch to Marathi
    const mrBtn = page.getByRole('button', { name: 'मराठी' });
    await mrBtn.click();
    await expect(page.getByText('भारत मानसिक आरोग्य आपत्कालीन हेल्पलाइन')).toBeVisible();

    // Asserts zero console errors
    expect(consoleErrors).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // 2. Subprocessors Register (/subprocessors)
  // --------------------------------------------------------------------------
  test('Subprocessors Register: displays Indian data localization and statutory DPA status', async ({ page }) => {
    const res = await page.goto('/subprocessors');
    expect(res?.status()).toBe(200);

    await expect(page.getByText('Authorized Sub-Processors & Data Architecture')).toBeVisible();
    await expect(page.getByText('Google Cloud Platform (GCP) India')).toBeVisible();
    await expect(page.getByText('Razorpay Software Private Limited')).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 3. Network Troubleshooter (/troubleshoot/network)
  // --------------------------------------------------------------------------
  test('Low-Bandwidth Troubleshooter: displays 360px mobile network diagnostic guidance', async ({ page }) => {
    const res = await page.goto('/troubleshoot/network');
    expect(res?.status()).toBe(200);

    await expect(page.getByText('Call Quality & Internet Help')).toBeVisible();
    await expect(page.getByText('Low-Bandwidth Assistance')).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 4. Doctor Onboarding & Verification Gate
  // --------------------------------------------------------------------------
  test('Practitioner Gate: unverified practitioner is blocked from issuing prescriptions', async ({ browser }) => {
    // Unverified clinician token explicitly matched to development environment
    const unverifiedDoctorToken = await createSignedSessionToken({
      uid: 'doc_unverified_99',
      role: 'clinician',
      orgId: 'org_clinic_delhi',
      env: 'development',
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Register practitioner profile (status defaults to 'pending')
    const registerRes = await page.request.post('http://localhost:3000/api/clinical/practitioner', {
      headers: {
        'Cookie': `session=${unverifiedDoctorToken}`,
      },
      data: {
        name: 'Dr. Sameer Sen',
        practitionerType: 'psychiatrist_rmp',
        qualifications: ['MBBS', 'MD (Psychiatry)'],
        registrationNumber: 'MCI-998877',
        medicalCouncil: 'Delhi Medical Council',
        registrationYear: 2021,
      },
    });
    expect(registerRes.status()).toBe(200);

    // 2. Attempt to issue prescription while verification is still pending
    const prescriptionRes = await page.request.post('http://localhost:3000/api/clinical/prescriptions', {
      headers: {
        'Cookie': `session=${unverifiedDoctorToken}`,
      },
      data: {
        consultationId: 'cons_123',
        patient: { id: 'pat_001', name: 'Rohan Sharma', age: 30, gender: 'male' },
        diagnosisNotes: 'Mild situational stress',
        medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'TDS', durationDays: 3, category: 'O' }],
        consultMode: 'video',
        consultType: 'first_consultation',
      },
    });

    // Server-enforced verification assertion: 403 Forbidden with PRACTITIONER_NOT_VERIFIED error
    expect(prescriptionRes.status()).toBe(403);
    const body = await prescriptionRes.json();
    expect(body.error).toContain('PRACTITIONER_NOT_VERIFIED');
    await context.close();
  });
});
