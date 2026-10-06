/**
 * REFRESH TOKEN — long-lived, stateful. Every /refresh rotates: the
 * presented token is revoked and a fresh pair is issued. Reuse of a revoked
 * token (replay attack) is detected and rejected. TTL index auto-expires
 * rows after expiresAt.
 */
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
