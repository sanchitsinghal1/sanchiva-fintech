const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const i = require('../controllers/insuranceController');
router.use(requireUser);
router.get('/', i.list);
router.post('/', validate(z.object({type:z.enum(['LIFE','HEALTH','MOTOR','TRAVEL','HOME','TERM']),provider:z.string(),policyNumber:z.string(),premium:z.number().positive(),sumInsured:z.number().positive(),startDate:z.string(),endDate:z.string()})), i.create);
module.exports = router;
