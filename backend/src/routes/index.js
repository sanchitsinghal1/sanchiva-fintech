/** Sanchiva REST routes — mounted under /api. */
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const cardRoutes = require('./cardRoutes');
const beneficiaryRoutes = require('./beneficiaryRoutes');
const requestRoutes = require('./requestRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const notificationRoutes = require('./notificationRoutes');
const stripeRoutes = require('./stripeRoutes');
const statementRoutes = require('./statementRoutes');
const chatRoutes = require('./chatRoutes');
const adminRoutes = require('./adminRoutes');
const vaultRoutes = require('./vaultRoutes');
const razorpayRoutes = require('./razorpayRoutes');

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/cards', cardRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/requests', requestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stripe', stripeRoutes);
router.use('/statement', statementRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/vaults', vaultRoutes);
router.use('/razorpay', razorpayRoutes);

module.exports = router;
