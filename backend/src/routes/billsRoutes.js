const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const b = require('../controllers/billsController');
router.use(requireUser);
router.get('/', b.list);
router.post('/', validate(z.object({category:z.string(),biller:z.string(),consumerNumber:z.string(),amount:z.number().positive(),dueDate:z.string().optional()})), b.create);
router.post('/:id/pay', b.pay);
module.exports = router;
