/** ACCOUNT CONTROLLER — list the user's accounts + primary lookup. */
const Account = require('../models/Account');
const Card = require('../models/Card');
const { ok, ApiError } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).lean();
    return ok(res, { accounts });
  } catch (err) {
    next(err);
  }
};

exports.primary = async (req, res, next) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) throw new ApiError('NOT_FOUND', 'No account found', 404);
    const cards = await Card.find({ userId: req.user._id, accountId: account._id }).lean();
    return ok(res, { account, cards });
  } catch (err) {
    next(err);
  }
};
