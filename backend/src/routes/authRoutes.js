const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimit');
const { validate } = require('../middleware/validate');
const { z } = require('zod');
const auth = require('../controllers/authController');
const { requireUser } = require('../middleware/auth');

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', requireUser, auth.me);
router.get('/sessions', requireUser, auth.mySessions);
router.put('/profile', requireUser, auth.updateProfile);
router.post('/kyc', requireUser, auth.completeKyc);

module.exports = router;
