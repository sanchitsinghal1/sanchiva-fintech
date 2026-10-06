/**
 * USER — the bank customer.
 * passwordHash is hashed in the pre-save hook (bcrypt cost 10) and stripped
 * from every toJSON() response. kycStatus gates money movement — only
 * VERIFIED users can transfer/withdraw.
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    dob: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: 'India' },
    occupation: { type: String, default: null },
    incomeRange: { type: String, default: null },
    kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    kycSubmittedAt: { type: Date, default: null },
    avatarColor: { type: String, default: 'emerald' },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
