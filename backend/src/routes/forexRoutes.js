const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const f = require('../controllers/forexController');
router.use(requireUser);
router.get('/rates', f.rates);
router.get('/balances', f.balances);
router.post('/exchange', validate(z.object({from:z.string(),to:z.string(),amount:z.number().positive()})), f.exchange);
module.exports = router;
