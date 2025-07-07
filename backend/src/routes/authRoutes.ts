import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refreshToken,
  logout,
  logoutAll
} from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Public routes
// Register Route mit Debug
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], registerValidation, register);

// Login Route mit Debug
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], loginValidation, login);

// Refresh Token Route
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], refreshTokenValidation, refreshToken); 

// Protected routes
router.post('/logout', auth, logout); 
router.post('/logout-all', auth, logoutAll); 

export default router;