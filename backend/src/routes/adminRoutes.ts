import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getDashboardMetrics,
  getAllUsers,
  getModerationReports,
  assignUniverseModerator,
  getPendingApprovals
} from '../controllers/adminController';

const router = Router();

// Dashboard Routes
router.get('/dashboard/metrics', auth, getDashboardMetrics);

// User Management Routes
router.get('/users', auth, getAllUsers);
router.post('/users/:userId/assign-moderator', auth, assignUniverseModerator);

// Moderation Routes
router.get('/moderation/reports', auth, getModerationReports);
router.get('/moderation/approvals', auth, getPendingApprovals);

// TODO: Add more admin routes
// router.post('/moderation/reports/:reportId/resolve', auth, resolveReport);
// router.post('/universes/:universeId/approve', auth, approveUniverse);
// router.post('/users/:userId/ban', auth, banUser);

export default router;