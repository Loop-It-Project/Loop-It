import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Helper function für Error-Handling
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
};

// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  console.log('🔍 Register route called');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const result = await AuthService.registerUser(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      token: result.tokens!.accessToken,
      refreshToken: result.tokens!.refreshToken,
      expiresIn: result.tokens!.expiresIn,
      user: result.user
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  console.log('🔍 Login route called with body:', Object.keys(req.body));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const result = await AuthService.loginUser(req.body);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.tokens!.accessToken,
      refreshToken: result.tokens!.refreshToken,
      expiresIn: result.tokens!.expiresIn,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
    });
  }
};

// TOKEN REFRESH
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
      return;
    }

    const result = await AuthService.refreshUserTokens(refreshToken);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.tokens!.accessToken,
      refreshToken: result.tokens!.refreshToken,
      expiresIn: result.tokens!.expiresIn
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
    });
  }
};

// LOGOUT
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await AuthService.logoutUser(req.body.refreshToken);

    res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// LOGOUT ALL
export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await AuthService.logoutUserFromAllDevices(
      req.user.id, 
      req.user.username
    );

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices'
    });
  }
};

// VALIDATION RULES
export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];