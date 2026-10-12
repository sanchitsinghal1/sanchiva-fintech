/**
 * Rate limiters.
 *   globalLimiter → 300 req / 15 min per IP (general abuse shield)
 *   authLimiter   → 10 req / 15 min per IP on /auth/login + /auth/register
 *                   (brute-force password protection)
 */
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later.' } },
});

module.exports = { globalLimiter, authLimiter };
