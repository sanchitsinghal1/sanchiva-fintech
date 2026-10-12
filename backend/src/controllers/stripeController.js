/**
 * STRIPE CONTROLLER (TEST MODE)
 * ----------------------------------------------------------------------------
 * addFunds → create a Stripe PaymentIntent for the top-up amount. The client
 *            confirms it with the Stripe.js Confirm Card Payment flow.
 *            HUMAN ACTION REQUIRED: set STRIPE_SECRET_KEY (sk_test_...) in
 *            backend/.env. Without it, the route returns a graceful message.
 * confirm  → after the client confirms the PaymentIntent, credit the user's
 *            wallet with an ACID deposit (TOPUP transaction). Test cards:
 *              4242 4242 4242 4242  /  any future expiry / any CVC.
 */
const { z } = require('zod');
const mongoose = require('mongoose');
const stripe = require('../config/stripe');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { ok, ApiError } = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketEmitter');
const { randRef } = require('./transactionController');

const createSchema = z.object({ amount: z.number().int().min(100, 'Minimum top-up is ₹100') });
const confirmSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().int().positive(),
});

exports.addFunds = async (req, res, next) => {
  try {
    const { amount } = createSchema.parse(req.body);
    if (!stripe.isConfigured())
      throw new ApiError(
        'STRIPE_NOT_CONFIGURED',
        'Stripe not configured. Add STRIPE_SECRET_KEY (sk_test_...) to backend/.env to enable card payments.',
        503
      );

    const intent = await stripe.paymentIntents.create({
      amount, // already in the smallest unit the frontend sends (₹1 = 100)
      currency: 'inr',
      metadata: { userId: req.user._id.toString(), purpose: 'wallet_topup' },
      automatic_payment_methods: { enabled: true },
    });

    return ok(res, { clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

exports.confirm = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { paymentIntentId, amount } = confirmSchema.parse(req.body);

    // Verify the intent succeeded (idempotent — calling twice is safe).
    if (stripe.isConfigured()) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded')
        throw new ApiError('PAYMENT_FAILED', `Payment not completed (status: ${intent.status})`, 400);
    }

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
          description: `Card top-up · ${paymentIntentId.slice(-8)}`,
          reference: randRef(),
        },
      ],
      { session }
    );
    await session.commitTransaction();
    await session.endSession();

    await Notification.create({
      userId: req.user._id,
      title: 'Wallet topped up',
      message: `₹${amount.toLocaleString('en-IN')} added to your wallet.`,
      type: 'TRANSACTION',
    });
    emitToUser(req.user._id, 'money-received', {
      amount,
      from: 'Stripe top-up',
      reference: txn[0].reference,
    });

    return ok(res, { ok: true, account: { balance: acc.balance } });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};
