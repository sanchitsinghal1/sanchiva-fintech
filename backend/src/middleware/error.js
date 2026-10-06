/** Centralised error handler — last middleware in the stack. */
const { ApiError } = require('../utils/apiResponse');
const { JsonWebTokenError } = require('jsonwebtoken');

const isDup = (err) => err && err.code === 11000;

const errorHandler = (err, _req, res, _next) => {
  console.error('[Sanchiva error]', err.message);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message } });
  }
  if (isDup(err)) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: `${field} already in use` } });
  }
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
  if (err.name === 'ValidationError') {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION', message: err.message } });
  }
  return res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
};

module.exports = { errorHandler };
