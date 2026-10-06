/**
 * TRANSACTION — immutable ledger entry. Money flows from -> to.
 * fromUserId/toUserId are denormalised for fast "my transactions" queries.
 * createdAt+_id compound index powers the infinite-scroll cursor.
 */
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    fromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null, index: true },
    toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REQUEST', 'SPLIT', 'TOPUP'],
      default: 'TRANSFER',
    },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
    category: {
      type: String,
      enum: ['FOOD', 'TRAVEL', 'BILLS', 'SHOPPING', 'INCOME', 'TRANSFER', 'OTHER'],
      default: 'TRANSFER',
    },
    description: { type: String, required: true, trim: true },
    reference: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ createdAt: -1, _id: -1 }); // cursor index

module.exports = mongoose.model('Transaction', TransactionSchema);
