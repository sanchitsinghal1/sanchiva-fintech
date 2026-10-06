/**
 * REQUEST CONTROLLER — money requests + split bills.
 * create → request money from another registered user (by email).
 *          SPLIT type also records the full bill + member shares.
 * list   → requests I received + requests I sent.
 * act    → accept / reject / pay. "pay" triggers an ACID transfer that
 *          settles the request atomically.
 */
const { z } = require('zod');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { ok, ApiError } = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketEmitter');
const { randRef } = require('./transactionController');

const createSchema = z.object({
  toEmail: z.string().email('Recipient email invalid'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(2, 'Description too short').max(160),
  type: z.enum(['REQUEST', 'SPLIT']).optional().default('REQUEST'),
  totalAmount: z.number().positive().optional(),
  splitMembers: z
    .array(z.object({ name: z.string(), share: z.number().positive() }))
    .optional(),
});

exports.list = async (req, res, next) => {
  try {
    const [received, sent] = await Promise.all([
      Request.find({ toUserId: req.user._id })
        .populate('fromUserId', 'name email avatarColor')
        .sort({ createdAt: -1 }),
      Request.find({ fromUserId: req.user._id })
        .populate('toUserId', 'name email avatarColor')
        .sort({ createdAt: -1 }),
    ]);
    return ok(res, { received, sent });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const recipient = await User.findOne({ email: body.toEmail });
    if (!recipient) throw new ApiError('NOT_FOUND', 'Recipient not registered with Sanchiva', 404);
    if (recipient._id.equals(req.user._id))
      throw new ApiError('BAD_REQUEST', 'Cannot request money from yourself', 400);

    const request = await Request.create({
      fromUserId: req.user._id,
      toUserId: recipient._id,
      amount: body.amount,
      description: body.description,
      type: body.type,
      totalAmount: body.totalAmount || body.amount,
      splitMembers: body.splitMembers || [],
      status: 'PENDING',
    });

    await Notification.create({
      userId: recipient._id,
      title: body.type === 'SPLIT' ? 'New split bill' : 'New money request',
      message: `${req.user.name} requested ₹${body.amount.toLocaleString('en-IN')} — ${body.description}`,
      type: 'REQUEST',
    });
    emitToUser(recipient._id, 'money-requested', {
      amount: body.amount,
      from: req.user.name,
      type: body.type,
      description: body.description,
      requestId: request._id,
    });

    return ok(res, { request }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

const actSchema = z.object({ action: z.enum(['accept', 'reject', 'pay']) });

exports.act = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { action } = actSchema.parse(req.body);
    const request = await Request.findById(req.params.id);
    if (!request) throw new ApiError('NOT_FOUND', 'Request not found', 404);
    if (!request.toUserId.equals(req.user._id))
      throw new ApiError('FORBIDDEN', 'This request is not for you', 403);
    if (request.status !== 'PENDING')
      throw new ApiError('CONFLICT', `Request already ${request.status.toLowerCase()}`, 409);

    if (action === 'reject') {
      request.status = 'REJECTED';
      await request.save();
      emitToUser(request.fromUserId, 'request-update', { requestId: request._id, status: 'REJECTED' });
      return ok(res, { request });
    }

    if (action === 'accept') {
      request.status = 'ACCEPTED';
      await request.save();
      emitToUser(request.fromUserId, 'request-update', { requestId: request._id, status: 'ACCEPTED' });
      return ok(res, { request });
    }

    // --- PAY: settle the request with an ACID transfer ---
    if (req.user.kycStatus !== 'VERIFIED')
      throw new ApiError('KYC_REQUIRED', 'Complete KYC before paying', 403);

    session.startTransaction();

    const src = await Account.findOne({ userId: req.user._id }).session(session);
    const dest = await Account.findOne({ userId: request.fromUserId }).session(session);
    if (!src || !dest) throw new ApiError('NOT_FOUND', 'Account missing', 404);
    if (src.balance < request.amount)
      throw new ApiError('INSUFFICIENT_FUNDS', 'Insufficient balance to pay this request', 400);

    src.balance -= request.amount;
    dest.balance += request.amount;
    await src.save({ session });
    await dest.save({ session });

    const txn = await Transaction.create(
      [
        {
          fromAccountId: src._id,
          toAccountId: dest._id,
          fromUserId: req.user._id,
          toUserId: request.fromUserId,
          amount: request.amount,
          type: 'REQUEST',
          status: 'COMPLETED',
          category: 'TRANSFER',
          description: `Settled: ${request.description}`,
          reference: randRef(),
        },
      ],
      { session }
    );

    request.status = 'PAID';
    await request.save({ session });

    await session.commitTransaction();
    await session.endSession();

    await Notification.create({
      userId: request.fromUserId,
      title: 'Request paid',
      message: `${req.user.name} paid your request of ₹${request.amount.toLocaleString('en-IN')}`,
      type: 'TRANSACTION',
    });
    emitToUser(request.fromUserId, 'money-received', {
      amount: request.amount,
      from: req.user.name,
      reference: txn[0].reference,
    });

    return ok(res, { request, transaction: { ...txn[0].toObject(), newBalance: src.balance } });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};
