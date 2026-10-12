const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const analytics = require('../controllers/analyticsController');

router.use(requireUser);
router.get('/', analytics.summary);

module.exports = router;
