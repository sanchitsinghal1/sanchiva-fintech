const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const n = require('../controllers/notificationController');

router.use(requireUser);
router.get('/', n.list);
router.patch('/:id/read', n.markRead);
router.post('/read-all', n.readAll);

module.exports = router;
