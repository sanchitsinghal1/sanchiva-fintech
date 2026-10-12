/** FX RATE — mock live exchange rates for multi-currency wallet. */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  base: { type: String, default: 'INR' }, quote: { type: String, required: true },
  rate: { type: Number, required: true }, changePct: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('FXRate', S);
