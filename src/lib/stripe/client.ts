import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_development_mode';

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
