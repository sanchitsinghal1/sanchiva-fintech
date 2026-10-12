/** LOAN — personal/home/auto/education loan + BNPL + credit line. */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['PERSONAL','HOME','AUTO','EDUCATION','BUSINESS','BNPL','CREDIT_LINE'], required: true },
  principal: { type: Number, required: true }, rate: { type: Number, required: true },
  tenureMonths: { type: Number, required: true }, emi: { type: Number, required: true },
  outstanding: { type: Number, required: true }, status: { type: String, enum: ['PENDING','APPROVED','REJECTED','ACTIVE','CLOSED'], default: 'PENDING' },
  disbursedAt: { type: Date, default: null },
}, { timestamps: true });
S.index({ userId: 1 });
module.exports = mongoose.model('Loan', S);
