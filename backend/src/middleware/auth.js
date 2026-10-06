/**
 * Auth middleware — verify the access token (Bearer header or httpOnly
 * cookie) and attach req.user.
 *   requireUser  → 401 if not authenticated
 *   requireAdmin → 403 if authenticated but not ADMIN
 */
const { verifyAccess } = require('../utils/jwt');
const User = require('../models/User');
const { ApiError } = require('../utils/apiResponse');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.sanchiva_access) return req.cookies.sanchiva_access;
  return null;
};

const requireUser = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
    const payload = verifyAccess(token);
    if (!payload || payload.type !== 'access')
      throw new ApiError('UNAUTHORIZED', 'Invalid or expired token', 401);

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError('UNAUTHORIZED', 'User not found', 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') return next(new ApiError('FORBIDDEN', 'Admin access required', 403));
  next();
};

module.exports = { requireUser, requireAdmin, extractToken };
