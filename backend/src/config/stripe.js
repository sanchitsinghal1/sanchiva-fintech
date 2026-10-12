/**
 * Stripe client (TEST MODE).
 * HUMAN ACTION REQUIRED: set STRIPE_SECRET_KEY in .env (sk_test_...)
 * The backend gracefully degrades if no key is set — the /api/stripe/*
 * routes return a clear message instead of crashing the server.
 */
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20',
});

module.exports = stripe;
module.exports.isConfigured = () =>
  !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
