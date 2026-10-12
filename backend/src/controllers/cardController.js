/**
 * CARD CONTROLLER
 * list       → all the user's cards.
 * update     → freeze/unfreeze (status) + set daily/monthly limits.
 * revealCvv  → transiently returns the demo CVV. In production this endpoint
 *              would delegate to the issuing bank and never store the CVV.
 */
const { z } = require('zod');
const Card = require('../models/Card');
const { ok, ApiError } = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketEmitter');

const updateSchema = z.object({
  status: z.enum(['ACTIVE', 'FROZEN', 'BLOCKED']).optional(),
  dailyLimit: z.number().min(0).optional(),
  monthlyLimit: z.number().min(0).optional(),
  color: z.string().optional(),
});

exports.list = async (req, res, next) => {
  try {
    const cards = await Card.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    // never leak cvvHash to the client
    const safe = cards.map((c) => ({ ...c, cvvHash: undefined }));
    return ok(res, { cards: safe });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const card = await Card.findOne({ _id: req.params.id, userId: req.user._id });
    if (!card) throw new ApiError('NOT_FOUND', 'Card not found', 404);

    if (body.status) card.status = body.status;
    if (body.dailyLimit !== undefined) card.dailyLimit = body.dailyLimit;
    if (body.monthlyLimit !== undefined) card.monthlyLimit = body.monthlyLimit;
    if (body.color) card.color = body.color;
    await card.save();

    if (body.status === 'FROZEN') {
      emitToUser(req.user._id, 'card-frozen', { cardId: card._id, last4: card.cardNumber.slice(-4) });
    }

    return ok(res, { card: { ...card.toObject(), cvvHash: undefined } });
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

exports.revealCvv = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, userId: req.user._id });
    if (!card) throw new ApiError('NOT_FOUND', 'Card not found', 404);
    if (card.status === 'FROZEN') throw new ApiError('FROZEN', 'Cannot reveal CVV on a frozen card', 403);
    // Demo only: returns the obfuscated CVV. Real systems never store this.
    return ok(res, { cvv: card.getCvv() });
  } catch (err) {
    next(err);
  }
};
