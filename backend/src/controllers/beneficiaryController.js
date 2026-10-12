/** BENEFICIARY CONTROLLER — CRUD on saved payees. */
const { z } = require('zod');
const Beneficiary = require('../models/Beneficiary');
const { ok, ApiError } = require('../utils/apiResponse');

const createSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  accountNumber: z.string().min(6, 'Enter a valid account number'),
  nickname: z.string().min(2, 'Nickname too short'),
  bankName: z.string().optional().default('Sanchiva Bank'),
  ifsc: z.string().optional().default('SANC0001'),
});

exports.list = async (req, res, next) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return ok(res, { beneficiaries });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const beneficiary = await Beneficiary.create({ userId: req.user._id, ...body });
    return ok(res, { beneficiary }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return next(new ApiError('VALIDATION', err.issues[0].message, 422));
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Beneficiary.deleteOne({ _id: req.params.id, userId: req.user._id });
    return ok(res, { ok: true });
  } catch (err) {
    next(err);
  }
};
