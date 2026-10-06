const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const account = require('../controllers/accountController');

router.use(requireUser);
router.get('/', account.list);
router.get('/primary', account.primary);

module.exports = router;
