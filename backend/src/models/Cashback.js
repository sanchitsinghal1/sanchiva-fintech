/** CASHBACK — rewards ledger (1-5% on Shopping). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  amount: { type: Number, required: true }, rate: { type: Number, required: true }, merchant: { type: String, default: '' },
}, { timestamps: true });
S.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Cashback', S);
