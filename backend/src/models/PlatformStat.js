/** PLATFORM STAT — daily reach (DAU, signups, pageViews, volume). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true },
  activeUsers: { type: Number, default: 0 }, newSignups: { type: Number, default: 0 },
  pageViews: { type: Number, default: 0 }, totalVolume: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('PlatformStat', S);
