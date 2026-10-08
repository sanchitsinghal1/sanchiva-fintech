/** SCHEDULED TRANSFER — recurring/future auto-pay. */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toAccountNumber: { type: String, required: true }, recipientName: { type: String, default: '' },
  amount: { type: Number, required: true }, note: { type: String, default: '' },
  category: { type: String, default: 'BILLS' }, frequency: { type: String, enum: ['ONCE', 'WEEKLY', 'MONTHLY'], default: 'MONTHLY' },
  nextRun: { type: Date, required: true }, status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED'], default: 'ACTIVE' },
}, { timestamps: true });
S.index({ userId: 1, nextRun: 1 });
module.exports = mongoose.model('ScheduledTransfer', S);
