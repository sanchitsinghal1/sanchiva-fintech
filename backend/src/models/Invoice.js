/** INVOICE — business banking (GST invoices, payment links, payouts). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  number: { type: String, required: true }, client: { type: String, required: true },
  amount: { type: Number, required: true }, gst: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT','SENT','PAID','OVERDUE','CANCELLED'], default: 'SENT' },
  issueDate: { type: Date, default: Date.now }, dueDate: { type: Date },
}, { timestamps: true });
S.index({ userId: 1 });
module.exports = mongoose.model('Invoice', S);
