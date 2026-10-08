const express = require('express'); const router = express.Router(); const { requireUser } = require('../middleware/auth'); const r = require('../controllers/razorpayController');
router.use(requireUser); router.post('/create-order', r.createOrder); router.post('/verify', r.verify); module.exports = router;
