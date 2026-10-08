const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const l = require('../controllers/loansController');
router.use(requireUser);
router.get('/', l.list);
router.get('/credit-score', l.creditScore);
router.post('/calc', validate(z.object({principal:z.number().positive(),rate:z.number().positive(),tenureMonths:z.number().int().positive()})), l.calc);
router.post('/apply', validate(z.object({type:z.enum(['PERSONAL','HOME','AUTO','EDUCATION','BUSINESS','BNPL','CREDIT_LINE']),principal:z.number().positive(),rate:z.number().positive(),tenureMonths:z.number().int().positive()})), l.apply);
module.exports = router;
