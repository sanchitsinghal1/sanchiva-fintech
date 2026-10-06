/**
 * AUTH CONTROLLER
 * ----------------------------------------------------------------------------
 * register     → create user + primary account + 2 virtual cards, set
 *                httpOnly cookies, return public user.
 * login        → verify credentials, issue token pair, set cookies.
 * refresh      → rotate refresh token (revoke old, mint new). Detects reuse.
 * logout       → revoke refresh token, clear cookies.
 * me           → current user + account + card summary.
 * completeKyc  → flip kycStatus to VERIFIED after KYC data submitted.
 * updateProfile→ edit name/phone/city/occupation/etc.
 */
const { z } = require('zod');
const User = require('../models/User');
const Account = require('../models/Account');
const Card = require('../models/Card');
const RefreshToken = require('../models/RefreshToken');
const Notification = require('../models/Notification');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { ok, ApiError } = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketEmitter');

const randDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const COLORS = ['emerald', 'violet', 'amber', 'rose', 'cyan'];

const setCookies = (res, access, refresh) => {
  const common = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  res.cookie('sanchiva_access', access, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie('sanchiva_refresh', refresh, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearCookies = (res) => {
  res.clearCookie('sanchiva_access', { path: '/' });
  res.clearCookie('sanchiva_refresh', { path: '/' });
};

const publicUser = (u) => ({
  id: u._id,
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  kycStatus: u.kycStatus,
  avatarColor: u.avatarColor,
  role: u.role,
  city: u.city,
  occupation: u.occupation,
  incomeRange: u.incomeRange,
  dob: u.dob,
  address: u.address,
  country: u.country,
});

// --- Zod schemas ---
const registerSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Invalid phone'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const kycSchema = z.object({
  dob: z.string(),
  address: z.string().min(3),
  city: z.string().min(2),
  occupation: z.string().min(2),
  incomeRange: z.string().min(2),
});
const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  city: z.string().min(2).optional(),
  occupation: z.string().min(2).optional(),
  incomeRange: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  avatarColor: z.string().optional(),
});

async function issueSession(res, user) {
  const access = signAccess(user);
  const refresh = await signRefresh(user);
  setCookies(res, access, refresh);
  return { user: publicUser(user), access };
}

// ============================== REGISTER ==============================
exports.register = async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new ApiError('CONFLICT', 'Email already registered', 409);

    const passwordHash = await hashPassword(body.password);
    const user = await User.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    // Primary SAVINGS account
    const account = await Account.create({
      userId: user._id,
      accountNumber: randDigits(10),
      type: 'SAVINGS',
      balance: 0,
      currency: 'INR',
    });

    // Auto-issue 2 virtual cards (VISA + Mastercard)
    await Card.create([
      {
        userId: user._id,
        accountId: account._id,
        cardNumber: `4242 4242 4242 ${randDigits(4)}`,
        cardHolder: user.name.toUpperCase(),
        expiryMonth: String(1 + Math.floor(Math.random() * 12)).padStart(2, '0'),
        expiryYear: String(27 + Math.floor(Math.random() * 5)),
        cvvHash: `demo:${randDigits(3)}`,
        network: 'VISA',
        type: 'VIRTUAL',
        color: 'emerald',
      },
      {
        userId: user._id,
        accountId: account._id,
        cardNumber: `5318 2222 3333 ${randDigits(4)}`,
        cardHolder: user.name.toUpperCase(),
        expiryMonth: String(1 + Math.floor(Math.random() * 12)).padStart(2, '0'),
        expiryYear: String(27 + Math.floor(Math.random() * 5)),
        cvvHash: `demo:${randDigits(3)}`,
        network: 'MASTERCARD',
        type: 'PHYSICAL',
        color: 'obsidian',
      },
    ]);

    await Notification.create({
      userId: user._id,
      title: 'Welcome to Sanchiva',
      message: 'Your premium banking account is ready. Complete KYC to unlock transfers.',
      type: 'SYSTEM',
    });

    const session = await issueSession(res, user);
    return ok(res, session, 201);
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

// ============================== LOGIN ==============================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new ApiError('UNAUTHORIZED', 'Invalid credentials', 401);
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new ApiError('UNAUTHORIZED', 'Invalid credentials', 401);

    const session = await issueSession(res, user);
    return ok(res, session);
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

// ============================== REFRESH ==============================
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.sanchiva_refresh || req.body?.refreshToken;
    if (!token) throw new ApiError('UNAUTHORIZED', 'No refresh token', 401);

    const payload = verifyRefresh(token);
    if (!payload) throw new ApiError('UNAUTHORIZED', 'Invalid refresh token', 401);

    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.revoked || stored.expiresAt < new Date())
      throw new ApiError('UNAUTHORIZED', 'Refresh token revoked or expired', 401);

    // Rotate: revoke the old, mint a new pair (replay-attack mitigation).
    await RefreshToken.updateOne({ _id: stored._id }, { revoked: true });
    const user = await User.findById(stored.userId);
    if (!user) throw new ApiError('UNAUTHORIZED', 'User not found', 401);

    const session = await issueSession(res, user);
    return ok(res, session);
  } catch (err) {
    next(err);
  }
};

// ============================== LOGOUT ==============================
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.sanchiva_refresh;
    if (token) await RefreshToken.updateOne({ token }, { revoked: true });
    clearCookies(res);
    return ok(res, { ok: true });
  } catch (err) {
    next(err);
  }
};

// ============================== ME ==============================
exports.me = async (req, res, next) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    const cardCount = await Card.countDocuments({ userId: req.user._id });
    return ok(res, {
      user: publicUser(req.user),
      account,
      cardCount,
    });
  } catch (err) {
    next(err);
  }
};

// ============================== COMPLETE KYC ==============================
exports.completeKyc = async (req, res, next) => {
  try {
    const body = kycSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          dob: body.dob,
          address: body.address,
          city: body.city,
          occupation: body.occupation,
          incomeRange: body.incomeRange,
          kycStatus: 'VERIFIED',
          kycSubmittedAt: new Date(),
        },
      },
      { new: true }
    );
    await Notification.create({
      userId: user._id,
      title: 'KYC Verified',
      message: 'Your identity has been verified. Transfers are now unlocked.',
      type: 'SECURITY',
    });
    emitToUser(user._id, 'notification', { title: 'KYC Verified' });
    return ok(res, { user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

// ============================== UPDATE PROFILE ==============================
exports.updateProfile = async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.user._id, { $set: body }, { new: true });
    return ok(res, { user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

module.exports.setCookies = setCookies;
module.exports.publicUser = publicUser;
