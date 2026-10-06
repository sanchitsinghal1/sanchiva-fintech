const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const ben = require('../controllers/beneficiaryController');

router.use(requireUser);
router.get('/', ben.list);
router.post('/', ben.create);
router.delete('/:id', ben.remove);

module.exports = router;
