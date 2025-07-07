import { Router } from 'express';
import { 
  reportPost, 
  processReport, 
  getReports,
  reportPostValidation,
  processReportValidation,
  getReportsValidation
} from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Post melden (User)
router.post(
  '/posts/:postId',
  authenticateToken,
  reportPostValidation,
  reportPost
);

// Reports abrufen (Admin only)
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  getReportsValidation,
  getReports
);

// Report verarbeiten (Admin only)
router.post(
  '/:reportId/process',
  authenticateToken,
  requireAdmin,
  processReportValidation,
  processReport
);

export default router;