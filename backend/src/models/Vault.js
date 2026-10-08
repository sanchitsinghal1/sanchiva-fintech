/** VAULT / POT — savings goal. */
const mongoose = require('mongoose');
const S = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true }, target: { type: Number, required: true, default: 0 },
  current: { type: Number, default: 0 }, color: { type: String, default: 'emerald' },
  icon: { type: String, default: '🎯' }, status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CLOSED'], default: 'ACTIVE' },
}, { timestamps: true });
module.exports = mongoose.model('Vault', S);
