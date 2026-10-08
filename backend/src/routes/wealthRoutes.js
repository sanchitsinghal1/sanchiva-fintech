const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const w = require('../controllers/wealthController');
router.use(requireUser);
router.get('/', w.list);
router.post('/', validate(z.object({type:z.enum(['FD','RD','MUTUAL_FUND','STOCK','ETF','GOLD','SGB','NPS','BOND']),name:z.string(),invested:z.number().positive(),currentValue:z.number().positive(),units:z.number().optional(),maturityDate:z.string().optional()})), w.create);
module.exports = router;
