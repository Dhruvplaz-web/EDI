import { describe, it, expect } from 'vitest';
import { validateEnvironment } from '@/lib/env';

describe('A.2 & C.1: Boot-time Environment Validation (env.ts)', () => {
  it('allows valid development configuration without production credentials', () => {
    const devConfig = {
      NODE_ENV: 'development' as const,
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
    };

    const parsed = validateEnvironment(devConfig);
    expect(parsed.NODE_ENV).toBe('development');
  });

  it('fails at boot in production if AUTH_SECRET is missing or under 32 bytes', () => {
    const prodConfigMissingAuthSecret = {
      NODE_ENV: 'production' as const,
      NEXT_PUBLIC_BASE_URL: 'https://praxis-ai.health',
      STRIPE_SECRET_KEY: 'sk_live_1234567890',
      STRIPE_WEBHOOK_SECRET: 'whsec_1234567890',
      TURN_SERVER_URL: 'turn.praxis-ai.health:3478',
      AUTH_SECRET: 'short_secret_only_20ch', // Too short (<32 bytes)
    };

    expect(() => validateEnvironment(prodConfigMissingAuthSecret)).toThrow(
      /AUTH_SECRET must be at least 32 bytes in production/
    );
  });

  it('fails at boot in production if TURN_SERVER_URL is missing', () => {
    const prodConfigMissingTurn = {
      NODE_ENV: 'production' as const,
      NEXT_PUBLIC_BASE_URL: 'https://praxis-ai.health',
      AUTH_SECRET: 'a_very_secure_long_secret_with_more_than_32_characters!!',
      STRIPE_SECRET_KEY: 'sk_live_1234567890',
      STRIPE_WEBHOOK_SECRET: 'whsec_1234567890',
      // TURN_SERVER_URL missing
    };

    expect(() => validateEnvironment(prodConfigMissingTurn)).toThrow(
      /TURN_SERVER_URL is required in production/
    );
  });

  it('fails at boot in production if TURN_SHARED_SECRET is missing', () => {
    const prodConfigMissingSecret = {
      NODE_ENV: 'production' as const,
      NEXT_PUBLIC_BASE_URL: 'https://praxis-ai.health',
      AUTH_SECRET: 'a_very_secure_long_secret_with_more_than_32_characters!!',
      STRIPE_SECRET_KEY: 'sk_live_1234567890',
      STRIPE_WEBHOOK_SECRET: 'whsec_1234567890',
      TURN_SERVER_URL: 'turn.praxis-ai.health:3478',
      // TURN_SHARED_SECRET missing
    };

    expect(() => validateEnvironment(prodConfigMissingSecret)).toThrow(
      /TURN_SHARED_SECRET is required in production/
    );
  });

  it('passes in production when all mandatory security secrets are configured', () => {
    const validProdConfig = {
      NODE_ENV: 'production' as const,
      NEXT_PUBLIC_BASE_URL: 'https://praxis-ai.health',
      AUTH_SECRET: 'a_very_secure_long_secret_with_more_than_32_characters!!',
      STRIPE_SECRET_KEY: 'sk_live_1234567890',
      STRIPE_WEBHOOK_SECRET: 'whsec_1234567890',
      TURN_SERVER_URL: 'turn.praxis-ai.health:3478',
      TURN_SHARED_SECRET: 'coturn_shared_secret_32bytes_min!!',
    };

    const parsed = validateEnvironment(validProdConfig);
    expect(parsed.AUTH_SECRET).toBe('a_very_secure_long_secret_with_more_than_32_characters!!');
    expect(parsed.TURN_SERVER_URL).toBe('turn.praxis-ai.health:3478');
    expect(parsed.TURN_SHARED_SECRET).toBe('coturn_shared_secret_32bytes_min!!');
  });
});
