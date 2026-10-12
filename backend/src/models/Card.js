/** CARD — virtual/physical. Pro: disposable + Intl/ATM/Online toggles. */
const mongoose = require('mongoose');
const CardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  cardNumber: { type: String, required: true, unique: true },
  cardHolder: { type: String, required: true, uppercase: true },
  expiryMonth: { type: String, required: true }, expiryYear: { type: String, required: true },
  cvvHash: { type: String, required: true },
  network: { type: String, enum: ['VISA', 'MASTERCARD', 'AMEX'], default: 'VISA' },
  type: { type: String, enum: ['VIRTUAL', 'PHYSICAL', 'CREDIT'], default: 'VIRTUAL' },
  status: { type: String, enum: ['ACTIVE', 'FROZEN', 'BLOCKED'], default: 'ACTIVE' },
  dailyLimit: { type: Number, default: 50000 }, monthlyLimit: { type: Number, default: 200000 },
  color: { type: String, default: 'emerald' }, spentToday: { type: Number, default: 0 }, spentThisMonth: { type: Number, default: 0 },
  disposable: { type: Boolean, default: false }, used: { type: Boolean, default: false },
  allowInternational: { type: Boolean, default: true }, allowATM: { type: Boolean, default: true }, allowOnline: { type: Boolean, default: true },
}, { timestamps: true });
CardSchema.methods.setCvv = function (cvv) { this.cvvHash = `demo:${cvv}`; };
CardSchema.methods.getCvv = function () { return this.cvvHash && this.cvvHash.startsWith('demo:') ? this.cvvHash.slice(5) : '***'; };
module.exports = mongoose.model('Card', CardSchema);
