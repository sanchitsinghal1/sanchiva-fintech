/** NOTIFICATION CONTROLLER — in-app feed + mark-as-read. */
const Notification = require('../models/Notification');
const { ok, ApiError } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return ok(res, { notifications, unread: notifications.filter((n) => !n.read).length });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) throw new ApiError('NOT_FOUND', 'Notification not found', 404);
    return ok(res, { notification: n });
  } catch (err) {
    next(err);
  }
};

exports.readAll = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return ok(res, { ok: true });
  } catch (err) {
    next(err);
  }
};
