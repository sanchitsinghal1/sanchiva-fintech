/**
 * REQUEST — money requests + split bills.
 *   REQUEST: from = creditor (wants money), to = debtor
 *   SPLIT:   from = bill owner, to = a participant; splitMembers[] lists all
 * status: PENDING -> ACCEPTED -> PAID (or REJECTED)
 */
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ['REQUEST', 'SPLIT'], default: 'REQUEST' },
    totalAmount: { type: Number, default: 0 },
    splitMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        share: Number,
      },
    ],
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'PAID'], default: 'PENDING' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', RequestSchema);
