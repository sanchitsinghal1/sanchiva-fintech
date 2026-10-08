/** INVESTMENT — FD, Mutual Fund, Stock, Gold holdings (Wealth module). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['FD','RD','MUTUAL_FUND','STOCK','ETF','GOLD','SGB','NPS','BOND'], required: true },
  name: { type: String, required: true }, invested: { type: Number, required: true },
  currentValue: { type: Number, required: true }, units: { type: Number, default: 0 },
  returnsPct: { type: Number, default: 0 }, maturityDate: { type: Date, default: null },
}, { timestamps: true });
S.index({ userId: 1 });
module.exports = mongoose.model("Investment", S);
