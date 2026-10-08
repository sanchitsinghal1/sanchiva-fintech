/** SESSION LOG — every login (admin live feed + Security Center). */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true }, email: { type: String, required: true, index: true },
  ipAddress: { type: String, default: '0.0.0.0' }, location: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' }, browser: { type: String, default: 'Unknown' },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
}, { timestamps: true });
S.index({ createdAt: -1 });
module.exports = mongoose.model('SessionLog', S);
