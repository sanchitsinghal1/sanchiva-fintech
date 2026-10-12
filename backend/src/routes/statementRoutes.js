const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const statement = require('../controllers/statementController');

router.use(requireUser);
router.get('/', statement.download);

module.exports = router;
