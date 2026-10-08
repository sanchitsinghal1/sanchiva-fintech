const express = require('express'); const router = express.Router(); const { requireUser } = require('../middleware/auth'); const chat = require('../controllers/chatController');
const limiter = require('express-rate-limit')({ windowMs: 60000, max: 20, standardHeaders: true, legacyHeaders: false, message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many messages, slow down.' } } });
router.use(requireUser); router.post('/', limiter, chat.chat); module.exports = router;
