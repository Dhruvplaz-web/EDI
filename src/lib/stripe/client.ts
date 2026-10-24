import Stripe from 'stripe';

const isProduction = process.env.NODE_ENV === 'production';
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || (isProduction && !isBuildTime ? '' : 'sk_test_placeholder_for_development_mode');

if (isProduction && !isBuildTime && (!stripeSecretKey || stripeSecretKey.includes('placeholder'))) {
  throw new Error(
    '[FATAL PRODUCTION CONFIG ERROR] STRIPE_SECRET_KEY is missing or using a development placeholder in production! Mock billing mode is prohibited in production runtime.'
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-03-25' as unknown as Stripe.LatestApiVersion,
  typescript: true,
  appInfo: {
    name: 'Praxis AI Healthcare Platform',
    version: '1.0.0',
    url: 'https://praxis-ai.health',
  },
});

export const isStripeConfigured = (): boolean => {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('placeholder')
  );
};
