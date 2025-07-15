import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import {
  deactivateAccount,
  reactivateAccount,
  deleteAccount,
  getAccountStatus,
  getDeletionImpactReport
} from '../controllers/accountController';

const router = Router();

// Validation middleware
const deleteAccountValidation = [
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required for account deletion'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const deactivateAccountValidation = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Account Management Routes
router.get('/status', auth, getAccountStatus);
router.get('/deletion-impact', auth, getDeletionImpactReport);
router.post('/deactivate', auth, deactivateAccountValidation, deactivateAccount);
router.post('/reactivate', auth, reactivateAccount);
router.delete('/delete', auth, deleteAccountValidation, deleteAccount);

export default router;