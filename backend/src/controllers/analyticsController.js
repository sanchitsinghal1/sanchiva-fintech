/**
 * ANALYTICS CONTROLLER — powers the dashboard spending charts.
 *   byCategory → sum of spend per category (excludes INCOME).
 *   timeseries → daily net for the last N days.
 *   totals     → total in / total out / net over the window.
 */
const mongoose = require('mongoose');
const Transaction = require("../models/Transaction");
const Cashback = require("../models/Cashback");
const User = require("../models/User");
const { ok } = require('../utils/apiResponse');

const CATEGORY_META = {
  FOOD: { label: 'Food & Dining', color: '#f59e0b' },
  TRAVEL: { label: 'Travel', color: '#06b6d4' },
  BILLS: { label: 'Bills & Utilities', color: '#f43f5e' },
  SHOPPING: { label: 'Shopping', color: '#a855f7' },
  INCOME: { label: 'Income', color: '#10b981' },
  TRANSFER: { label: 'Transfers', color: '#eab308' },
  OTHER: { label: 'Other', color: '#64748b' },
};

exports.summary = async (req, res, next) => {
  try {
    const days = parseInt(req.query.range, 10) || 30;
    const since = new Date(Date.now() - days * 86400_000);
    const uid = new mongoose.Types.ObjectId(req.user._id);

    // --- Spend by category (money going OUT, excluding income) ---
    const byCategoryAgg = await Transaction.aggregate([
      {
        $match: {
          fromUserId: uid,
          status: 'COMPLETED',
          createdAt: { $gte: since },
          category: { $ne: 'INCOME' },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const byCategory = byCategoryAgg.map((r) => ({
      category: r._id,
      label: CATEGORY_META[r._id]?.label || r._id,
      color: CATEGORY_META[r._id]?.color || '#64748b',
      total: Math.round(r.total * 100) / 100,
    }));

    // --- Daily timeseries for the window ---
    const dailyAgg = await Transaction.aggregate([
      {
        $match: {
          $or: [{ fromUserId: uid }, { toUserId: uid }],
          status: 'COMPLETED',
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          out: { $sum: { $cond: [{ $eq: ['$fromUserId', uid] }, '$amount', 0] } },
          inn: { $sum: { $cond: [{ $eq: ['$toUserId', uid] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const timeseries = dailyAgg.map((d) => ({
      date: d._id,
      out: Math.round(d.out * 100) / 100,
      in: Math.round(d.inn * 100) / 100,
    }));

    // --- Totals ---
    const totalsAgg = await Transaction.aggregate([
      {
        $match: {
          $or: [{ fromUserId: uid }, { toUserId: uid }],
          status: 'COMPLETED',
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalOut: { $sum: { $cond: [{ $eq: ['$fromUserId', uid] }, '$amount', 0] } },
          totalIn: { $sum: { $cond: [{ $eq: ['$toUserId', uid] }, '$amount', 0] } },
        },
      },
    ]);
    const totals = totalsAgg[0] || { totalOut: 0, totalIn: 0 };

    return ok(res, {
      byCategory,
      timeseries,
      totals: {
        totalOut: Math.round(totals.totalOut * 100) / 100,
        totalIn: Math.round(totals.totalIn * 100) / 100,
        net: Math.round((totals.totalIn - totals.totalOut) * 100) / 100,
      },
      days,
    });
  } catch (err) {
    next(err);
  }
};

// ============================== REWARDS ==============================
exports.rewards = async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user._id);
    const since = new Date(Date.now() - 90 * 86400_000);
    const volAgg = await Transaction.aggregate([
      { $match: { fromUserId: uid, status: 'COMPLETED', createdAt: { $gte: since }, category: { $ne: 'INCOME' } } },
      { $group: { _id: null, volume: { $sum: '$amount' } } },
    ]);
    const volume = volAgg[0]?.volume || 0;
    const tier = volume >= 150000 ? 'OBSIDIAN' : volume >= 25000 ? 'GOLD' : 'SILVER';
    if (req.user.tier !== tier) { await User.updateOne({ _id: req.user._id }, { tier }); req.user.tier = tier; }
    const recent = await Cashback.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10).lean();
    return ok(res, { tier, volume: Math.round(volume * 100) / 100, cashbackTotal: req.user.cashbackTotal || 0, recent });
  } catch (err) { next(err); }
};
