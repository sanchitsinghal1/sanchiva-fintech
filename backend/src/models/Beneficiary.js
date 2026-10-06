/** BENEFICIARY — saved payee. */
const mongoose = require('mongoose');

const BeneficiarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true, index: true },
    bankName: { type: String, default: 'Sanchiva Bank' },
    ifsc: { type: String, default: 'SANC0001' },
    nickname: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Beneficiary', BeneficiarySchema);
