const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const card = require('../controllers/cardController');

router.use(requireUser);
router.get('/', card.list);
router.patch('/:id', card.update);
router.get('/:id/cvv', card.revealCvv);

module.exports = router;
