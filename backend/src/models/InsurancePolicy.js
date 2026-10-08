/** INSURANCE POLICY — life/health/motor/travel/home. */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['LIFE','HEALTH','MOTOR','TRAVEL','HOME','TERM'], required: true },
  provider: { type: String, required: true }, policyNumber: { type: String, required: true },
  premium: { type: Number, required: true }, sumInsured: { type: Number, required: true },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE','EXPIRED','LAPSED','CLAIMED'], default: 'ACTIVE' },
}, { timestamps: true });
S.index({ userId: 1 });
module.exports = mongoose.model('InsurancePolicy', S);
