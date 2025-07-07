import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { body, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// USER PROFILE abrufen
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const profile = await UserService.getUserProfile(req.user.id);
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
};

// PUBLIC USER PROFILE abrufen (für andere User)
export const getPublicUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    
    if (!username) {
      res.status(400).json({
        success: false,
        error: 'Username is required'
      });
      return;
    }

    const profile = await UserService.getPublicUserProfile(username);
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get public user profile error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }
};

// USER SETTINGS abrufen
export const getUserSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const settings = await UserService.getUserSettings(req.user.id);
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings'
    });
  }
};

// USER SETTINGS aktualisieren
export const updateUserSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await UserService.updateUserSettings(req.user.id, req.body);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings'
    });
  }
};

// USER PROFILE aktualisieren
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // ✅ Stelle sicher, dass Profile existiert
    await UserService.ensureUserProfile(req.user.id);
    
    const result = await UserService.updateUserProfile(req.user.id, req.body);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
};

// PASSWORD ändern
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};

// Geo-Tracking Settings abrufen
export const getGeoTrackingSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const result = await UserService.getGeoTrackingSettings(userId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get geo tracking settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get geo tracking settings'
    });
  }
};

// Geo-Tracking Settings aktualisieren
export const updateGeoTrackingSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settingsData = req.body;
    
    const result = await UserService.updateGeoTrackingSettings(userId, settingsData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update geo tracking settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update geo tracking settings'
    });
  }
};

// Standort aktualisieren
export const updateUserLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const locationData = req.body;
    
    const result = await UserService.updateUserLocation(userId, locationData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update user location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
};

// VALIDATION RULES
export const updateProfileValidation = [
  body('displayName').optional().isLength({ min: 1, max: 100 }).withMessage('Display name must be 1-100 characters'),
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('hobbies').optional().isArray().withMessage('Hobbies must be an array'),
];

export const updateSettingsValidation = [
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be boolean'),
  body('profileVisibility').optional().isIn(['public', 'friends', 'private']).withMessage('Invalid profile visibility'),
  body('locationVisibility').optional().isIn(['public', 'friends', 'private']).withMessage('Invalid location visibility'),
  body('searchRadius').optional().isInt({ min: 1, max: 500 }).withMessage('Search radius must be between 1 and 500 km'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];