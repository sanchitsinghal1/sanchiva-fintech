/** BILL — BBPS-style bill/recharge payment (electricity, mobile, FASTag, etc.). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, enum: ['ELECTRICITY','WATER','GAS','MOBILE','DTH','BROADBAND','FASTAG','INSURANCE','LOAN_EMI','TAX'], required: true },
  biller: { type: String, required: true }, consumerNumber: { type: String, required: true },
  amount: { type: Number, required: true }, status: { type: String, enum: ['PENDING','PAID','FAILED'], default: 'PENDING' },
  dueDate: { type: Date }, paidAt: { type: Date, default: null }, reference: { type: String },
}, { timestamps: true });
S.index({ userId: 1, dueDate: 1 });
module.exports = mongoose.model('Bill', S);
