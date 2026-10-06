const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const stripe = require('../controllers/stripeController');

router.use(requireUser);
router.post('/add-funds', stripe.addFunds);
router.post('/confirm', stripe.confirm);

module.exports = router;
