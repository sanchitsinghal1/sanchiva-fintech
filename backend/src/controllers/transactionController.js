/**
 * TRANSACTION CONTROLLER
 * ----------------------------------------------------------------------------
 * list     → cursor-paginated (infinite scroll). Each page returns the
 *            oldest item's _id+createdAt as the next cursor.
 * transfer → ACID money movement using a Mongoose session. Both balance
 *            updates + the ledger rows commit atomically; if either fails,
 *            the whole transaction aborts and no money is lost.
 *            * Guarantees: source is debited iff destination is credited
 *              iff the two ledger rows are written.
 *            * Recipient lookup is by accountNumber (external transfers)
 *              OR by recipient email (peer transfers).
 * deposit  → external cash-in (no source account). Used by Stripe top-ups.
 */
const { z } = require('zod');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ok, ApiError } = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketEmitter');

const randRef = () => `TXN${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1e4)}`;

const transferSchema = z.object({
  toAccountNumber: z.string().min(6, 'Enter a valid recipient account number'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().max(140).optional().default(''),
  category: z
    .enum(['FOOD', 'TRAVEL', 'BILLS', 'SHOPPING', 'INCOME', 'TRANSFER', 'OTHER'])
    .optional()
    .default('TRANSFER'),
});

// ============================== LIST (infinite scroll) ==============================
exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { category, type, q } = req.query;
    let cursor = req.query.cursor; // "<createdAt>_<id>"

    // Build query: transactions where the user is sender OR receiver.
    const uid = new mongoose.Types.ObjectId(req.user._id);
    const match = { $or: [{ fromUserId: uid }, { toUserId: uid }] };

    if (category && category !== 'ALL') match.category = category;
    if (type && type !== 'ALL') match.type = type;
    if (q) match.description = { $regex: q, $options: 'i' };

    if (cursor) {
      const [crtStr, idStr] = cursor.split('_');
      const createdAt = new Date(crtStr);
      const _id = new mongoose.Types.ObjectId(idStr);
      // cursor: older than (createdAt, _id) — compound index powers this.
      match.$and = [{ $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: _id } }] }];
    }

    const items = await Transaction.find(match)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    let nextCursor = null;
    if (items.length > limit) {
      items.pop(); // remove the lookahead row
      const last = items[items.length - 1];
      nextCursor = `${last.createdAt.toISOString()}_${last._id}`;
    }

    return ok(res, { items, nextCursor });
  } catch (err) {
    next(err);
  }
};

// ============================== TRANSFER (ACID) ==============================
exports.transfer = async (req, res, next) => {
  // A Mongoose session = MongoDB client session. Operations inside
  // session.startTransaction() are atomic: all-or-nothing. If anything
  // throws, session.abortTransaction() rolls back every write.
  const session = await mongoose.startSession();
  try {
    const { toAccountNumber, amount, note, category } = transferSchema.parse(req.body);

    if (req.user.kycStatus !== 'VERIFIED')
      throw new ApiError('KYC_REQUIRED', 'Complete KYC before transferring money', 403);

    session.startTransaction();

    // --- Lock + load source account (inside the transaction) ---
    const src = await Account.findOne({ userId: req.user._id }).session(session);
    if (!src) throw new ApiError('NOT_FOUND', 'Source account not found', 404);
    if (src.status !== 'ACTIVE') throw new ApiError('BLOCKED', 'Source account is not active', 403);
    if (src.balance < amount)
      throw new ApiError('INSUFFICIENT_FUNDS', 'Insufficient balance for this transfer', 400);

    // --- Resolve destination account ---
    const dest = await Account.findOne({ accountNumber: toAccountNumber }).session(session);
    if (!dest) throw new ApiError('NOT_FOUND', 'Recipient account not found', 404);
    if (dest._id.equals(src._id)) throw new ApiError('BAD_REQUEST', 'Cannot transfer to your own account', 400);

    const destUser = await User.findById(dest.userId).session(session);

    // --- Debit source, credit destination (both inside the session) ---
    src.balance -= amount;
    dest.balance += amount;
    await src.save({ session });
    await dest.save({ session });

    // --- Write both ledger rows atomically ---
    // `ordered: true` is required by Mongoose when inserting multiple
    // documents inside a session.
    const [debit, credit] = await Transaction.create(
      [
        {
          fromAccountId: src._id,
          toAccountId: dest._id,
          fromUserId: req.user._id,
          toUserId: dest.userId,
          amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          category,
          description: note || `Transfer to ${destUser?.name || toAccountNumber}`,
          reference: randRef(),
        },
        {
          fromAccountId: src._id,
          toAccountId: dest._id,
          fromUserId: req.user._id,
          toUserId: dest.userId,
          amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          category: 'INCOME',
          description: note || `Transfer from ${req.user.name}`,
          reference: randRef(),
        },
      ],
      { session, ordered: true }
    );

    // --- Commit the whole unit of work atomically ---
    await session.commitTransaction();
    await session.endSession();

    // --- Real-time push to recipient (outside the txn for speed) ---
    if (destUser) {
      await Notification.create({
        userId: destUser._id,
        title: 'Money received',
        message: `${req.user.name} sent you ₹${amount.toLocaleString('en-IN')}`,
        type: 'TRANSACTION',
      });
      emitToUser(destUser._id, 'money-received', {
        amount,
        from: req.user.name,
        reference: credit.reference,
        newBalance: dest.balance,
      });
    }

    return ok(res, {
      transaction: { ...debit.toObject(), newBalance: src.balance },
    });
  } catch (err) {
    // Anything failed → roll back. Money never moves partially.
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

// ============================== DEPOSIT (external cash-in / Stripe top-up) ==============================
exports.deposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { amount, note } = req.body;
    if (typeof amount !== 'number' || amount <= 0)
      throw new ApiError('VALIDATION', 'Amount must be positive', 422);

    session.startTransaction();
    const acc = await Account.findOne({ userId: req.user._id }).session(session);
    if (!acc) throw new ApiError('NOT_FOUND', 'Account not found', 404);
    acc.balance += amount;
    await acc.save({ session });

    const txn = await Transaction.create(
      [
        {
          toAccountId: acc._id,
          toUserId: req.user._id,
          amount,
          type: 'TOPUP',
          status: 'COMPLETED',
          category: 'INCOME',
          description: note || 'Wallet top-up',
          reference: randRef(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await session.endSession();
    return ok(res, { transaction: { ...txn[0].toObject(), newBalance: acc.balance } });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();
    next(err);
  }
};

module.exports.randRef = randRef;
