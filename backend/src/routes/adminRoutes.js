const express = require('express'); const router = express.Router();
const { requireUser, requireAdmin } = require('../middleware/auth'); const admin = require('../controllers/adminController');
router.use(requireUser, requireAdmin);
router.get('/stats', admin.stats); router.get('/users', admin.users); router.get('/sessions', admin.sessions);
router.get('/platform-stats', admin.platformStats); router.get('/health', admin.health);
router.patch('/users/:id/approve-kyc', admin.approveKyc); router.patch('/users/:id/freeze', admin.toggleFreeze);
router.post('/users/:id/revoke-sessions', admin.revokeSessions);
module.exports = router;
