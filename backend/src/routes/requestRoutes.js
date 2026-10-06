const express = require('express');
const router = express.Router();
const { requireUser } = require('../middleware/auth');
const req = require('../controllers/requestController');

router.use(requireUser);
router.get('/', req.list);
router.post('/', req.create);
router.patch('/:id', req.act);

module.exports = router;
