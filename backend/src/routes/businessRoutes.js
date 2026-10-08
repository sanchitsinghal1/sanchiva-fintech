const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const b = require('../controllers/businessController');
router.use(requireUser);
router.get('/invoices', b.invoices);
router.post('/invoices', validate(z.object({client:z.string(),amount:z.number().positive(),gst:z.number().optional(),dueDate:z.string().optional()})), b.createInvoice);
router.post('/pay-link', validate(z.object({amount:z.number().positive(),note:z.string().optional()})), b.link);
module.exports = router;
