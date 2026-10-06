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

module.exports = router;
