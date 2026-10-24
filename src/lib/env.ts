import { z } from 'zod';

const ALLOWED_INDIA_REGIONS = ['asia-south1', 'asia-south2'];

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

    // India Data Residency Configuration (Default: asia-south1 Mumbai)
    DATA_REGION: z.string().default('asia-south1'),
    STORAGE_REGION: z.string().optional(),
    FIRESTORE_REGION: z.string().optional(),
    VERTEX_AI_REGION: z.string().optional(),
    REDIS_REGION: z.string().optional(),
    ALLOW_NON_INDIA_REGION_OVERRIDE: z.string().optional(),

    // Cryptographic Session Secret (Mandatory in production, >=32 bytes)
    AUTH_SECRET: z.string().optional(),

    // Client Firebase Configuration (Optional in local development fallback)
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

    // Server-Side Firebase Admin Configuration
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // WebRTC TURN Server (Mandatory in production for hospital firewall NAT traversal)
    TURN_SERVER_URL: z.string().optional(),
    TURN_SHARED_SECRET: z.string().optional(),

    // Domestic India Razorpay Subscriptions (UPI Autopay, cards, e-NACH)
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    // International Stripe SaaS Billing Configuration
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Optional AI Enrichment Key
    GEMINI_API_KEY: z.string().optional(),
    ENABLE_DEV_LOGIN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      // 1. Mandatory India Data Sovereignty Boot-Time Validation
      const overrideActive = data.ALLOW_NON_INDIA_REGION_OVERRIDE === 'true';
      if (!overrideActive) {
        const regionsToCheck: Array<{ name: string; value: string | undefined }> = [
          { name: 'DATA_REGION', value: data.DATA_REGION },
          { name: 'STORAGE_REGION', value: data.STORAGE_REGION },
          { name: 'FIRESTORE_REGION', value: data.FIRESTORE_REGION },
          { name: 'VERTEX_AI_REGION', value: data.VERTEX_AI_REGION },
          { name: 'REDIS_REGION', value: data.REDIS_REGION },
        ];

        for (const r of regionsToCheck) {
          if (r.value && !ALLOWED_INDIA_REGIONS.includes(r.value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [r.name],
              message: `FATAL_DATA_RESIDENCY_VIOLATION: Production data region [${r.value}] for ${r.name} is outside sovereign Indian territory. Health data, Firestore, backups, and AI endpoints must be hosted in 'asia-south1' (Mumbai) or 'asia-south2' (Delhi). Set ALLOW_NON_INDIA_REGION_OVERRIDE='true' only if explicit legal dispensation exists.`,
            });
          }
        }
      }

      // 2. Cryptographic Secret Validation
      if (!data.AUTH_SECRET || data.AUTH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_SECRET'],
          message: 'AUTH_SECRET must be at least 32 bytes in production.',
        });
      }

      // 3. WebRTC Media Routing
      if (!data.TURN_SERVER_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TURN_SERVER_URL'],
          message: 'TURN_SERVER_URL is required in production for WebRTC media routing.',
        });
      }

      if (!data.TURN_SHARED_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TURN_SHARED_SECRET'],
          message: 'TURN_SHARED_SECRET is required in production for WebRTC media routing.',
        });
      }
    }
  });

export function validateEnvironment(input: Record<string, unknown>) {
  return envSchema.parse(input);
}

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  DATA_REGION: process.env.DATA_REGION || 'asia-south1',
  STORAGE_REGION: process.env.STORAGE_REGION,
  FIRESTORE_REGION: process.env.FIRESTORE_REGION,
  VERTEX_AI_REGION: process.env.VERTEX_AI_REGION,
  REDIS_REGION: process.env.REDIS_REGION,
  ALLOW_NON_INDIA_REGION_OVERRIDE: process.env.ALLOW_NON_INDIA_REGION_OVERRIDE,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  TURN_SERVER_URL: process.env.TURN_SERVER_URL,
  TURN_SHARED_SECRET: process.env.TURN_SHARED_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN,
});
