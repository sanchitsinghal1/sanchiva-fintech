const express = require('express'); const router = express.Router(); const { z } = require('zod');
const { requireUser } = require('../middleware/auth'); const { validate } = require('../middleware/validate'); const v = require('../controllers/vaultController');
router.use(requireUser);
router.get('/', v.list);
router.post('/', validate(z.object({name:z.string().min(2),target:z.number().positive(),color:z.string().optional(),icon:z.string().optional()})), v.create);
router.post('/:id/deposit', validate(z.object({amount:z.number().positive()})), v.deposit);
router.post('/:id/withdraw', validate(z.object({amount:z.number().positive()})), v.withdraw);
router.delete('/:id', v.remove);
module.exports = router;
