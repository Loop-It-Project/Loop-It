import express from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createBugReport,
  getAllBugReports,
  getBugReportById,
  updateBugReportStatus,
  deleteBugReport,
  getBugReportStats,
  getUserBugReports
} from '../controllers/bugReportController';

const router = express.Router();

// Validation middleware
const createBugReportValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isIn(['ui', 'functionality', 'performance', 'security', 'data', 'other'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority')
];

const updateBugReportValidation = [
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'duplicate', 'invalid'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isIn(['ui', 'functionality', 'performance', 'security', 'data', 'other'])
    .withMessage('Invalid category'),
  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('Invalid assigned user ID'),
  body('adminNotes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Admin notes cannot exceed 2000 characters')
];

// ✅ Public/User Routes
router.post('/', authMiddleware, createBugReportValidation, createBugReport);
router.get('/my-reports', authMiddleware, getUserBugReports);
router.get('/:id', authMiddleware, getBugReportById);

// ✅ Admin Routes
router.get('/', authMiddleware, getAllBugReports);
router.put('/:id', authMiddleware, updateBugReportValidation, updateBugReportStatus);
router.delete('/:id', authMiddleware, deleteBugReport);
router.get('/admin/stats', authMiddleware, getBugReportStats);

export default router;