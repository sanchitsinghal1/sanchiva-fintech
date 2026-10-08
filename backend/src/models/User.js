/** USER — role USER | SUPER_ADMIN (founder email auto-elevated). + tier, cashback, budget. */
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, required: true, trim: true },
  dob: { type: String, default: null }, address: { type: String, default: null },
  city: { type: String, default: null }, country: { type: String, default: 'India' },
  occupation: { type: String, default: null }, incomeRange: { type: String, default: null },
  kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  kycSubmittedAt: { type: Date, default: null }, avatarColor: { type: String, default: 'emerald' },
  role: { type: String, enum: ['USER', 'SUPER_ADMIN'], default: 'USER' },
  frozen: { type: Boolean, default: false },
  budgetLimits: { type: Map, of: Number, default: { FOOD: 8000, TRAVEL: 6000, BILLS: 10000, SHOPPING: 12000 } },
  roundUpsEnabled: { type: Boolean, default: false },
  tier: { type: String, enum: ['SILVER', 'GOLD', 'OBSIDIAN'], default: 'SILVER' },
  cashbackTotal: { type: Number, default: 0 },
}, { timestamps: true });
UserSchema.methods.toJSON = function () {
  const obj = this.toObject(); delete obj.passwordHash; delete obj.__v;
  if (obj.budgetLimits instanceof Map) obj.budgetLimits = Object.fromEntries(obj.budgetLimits);
  return obj;
};
module.exports = mongoose.model('User', UserSchema);
