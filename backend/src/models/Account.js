/**
 * ACCOUNT — wallet/bank account owned by a user. One primary SAVINGS
 * account is created per user on registration. balance stored in major
 * currency units (INR); for cent-precision swap to Decimal128.
 */
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['SAVINGS', 'CURRENT', 'WALLET'], default: 'SAVINGS' },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['ACTIVE', 'DORMANT', 'CLOSED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', AccountSchema);
