/** ACCOUNT — primary balance + multi-currency side wallets. */
const mongoose = require('mongoose');
const AccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountNumber: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['SAVINGS', 'CURRENT', 'WALLET'], default: 'SAVINGS' },
  balance: { type: Number, default: 0 }, currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['ACTIVE', 'DORMANT', 'CLOSED', 'FROZEN'], default: 'ACTIVE' },
  currencyBalances: [{ currency: { type: String, default: 'INR' }, balance: { type: Number, default: 0 } }],
}, { timestamps: true });
module.exports = mongoose.model('Account', AccountSchema);
