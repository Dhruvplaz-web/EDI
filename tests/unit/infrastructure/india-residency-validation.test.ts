import { describe, it, expect } from 'vitest';
import { envSchema } from '@/lib/env';

describe('Part 3: India Regional Infrastructure & Boot-Time Validation Suite', () => {
  const validProductionBase = {
    NODE_ENV: 'production' as const,
    NEXT_PUBLIC_BASE_URL: 'https://app.praxis-ai.in',
    AUTH_SECRET: 'super-secure-production-cryptographic-secret-key-32-bytes',
    TURN_SERVER_URL: 'turn:turn.mumbai.praxis-ai.in:3478',
    TURN_SHARED_SECRET: 'turn-shared-secret-key-for-mumbai-datacenter',
  };

  it('passes validation when production data region is asia-south1 (Mumbai)', () => {
    const result = envSchema.safeParse({
      ...validProductionBase,
      DATA_REGION: 'asia-south1',
      STORAGE_REGION: 'asia-south1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATA_REGION).toBe('asia-south1');
    }
  });

  it('passes validation when production data region is asia-south2 (Delhi)', () => {
    const result = envSchema.safeParse({
      ...validProductionBase,
      DATA_REGION: 'asia-south2',
      FIRESTORE_REGION: 'asia-south2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATA_REGION).toBe('asia-south2');
    }
  });

  it('fails boot in production when DATA_REGION is outside India (e.g. us-central1)', () => {
    const result = envSchema.safeParse({
      ...validProductionBase,
      DATA_REGION: 'us-central1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const residencyIssue = issues.find((i) => i.path.includes('DATA_REGION'));
      expect(residencyIssue).toBeDefined();
      expect(residencyIssue?.message).toContain('FATAL_DATA_RESIDENCY_VIOLATION');
      expect(residencyIssue?.message).toContain('asia-south1');
    }
  });

  it('fails boot in production when secondary storage or AI region is outside India', () => {
    const result = envSchema.safeParse({
      ...validProductionBase,
      DATA_REGION: 'asia-south1',
      STORAGE_REGION: 'europe-west1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const storageIssue = issues.find((i) => i.path.includes('STORAGE_REGION'));
      expect(storageIssue).toBeDefined();
      expect(storageIssue?.message).toContain('FATAL_DATA_RESIDENCY_VIOLATION');
    }
  });

  it('allows override only when explicit ALLOW_NON_INDIA_REGION_OVERRIDE is enabled', () => {
    const result = envSchema.safeParse({
      ...validProductionBase,
      DATA_REGION: 'us-central1',
      ALLOW_NON_INDIA_REGION_OVERRIDE: 'true',
    });

    expect(result.success).toBe(true);
  });
});
