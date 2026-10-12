const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const txn = require('../controllers/transactionController');

router.use(requireUser);
router.get('/', txn.list);
router.post('/transfer', txn.transfer);
router.post('/deposit', txn.deposit);

module.exports = router;
