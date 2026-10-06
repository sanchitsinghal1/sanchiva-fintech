/**
 * JWT access + refresh token pair.
 *   access  → stateless, 15m, verified on every protected request
 *   refresh → stateful, 7d, persisted in RefreshToken collection, rotated
 */
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';

const signAccess = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

const signRefresh = async (user) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = jwt.sign({ sub: user._id.toString(), type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
  await RefreshToken.create({ userId: user._id, token, expiresAt });
  return token;
};

const verifyAccess = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
};

const verifyRefresh = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
};

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
