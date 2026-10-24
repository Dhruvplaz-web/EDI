import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

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

    // Stripe B2B SaaS Billing Configuration
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Optional AI Enrichment Key
    GEMINI_API_KEY: z.string().optional(),
    ENABLE_DEV_LOGIN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.AUTH_SECRET || data.AUTH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_SECRET'],
          message: 'AUTH_SECRET must be at least 32 bytes in production.',
        });
      }

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
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN,
});
