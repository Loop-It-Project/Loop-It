import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { body, validationResult } from 'express-validator';
import { db } from '../db/connection';
import { 
  usersTable, 
  postsTable, 
  universesTable, 
  profilesTable 
} from '../db/Schemas';
import { eq, desc, asc, and } from 'drizzle-orm';
import { ChatPermissionService } from '../services/chatPermissionService';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Eigenes Profil abrufen
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
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

// Öffentliches Profil abrufen
export const getPublicUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    
    if (!username) {
      res.status(400).json({ success: false, error: 'Username is required' });
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
      res.status(404).json({ success: false, error: 'User not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get user profile' });
    }
  }
};

// User's eigene Posts abrufen
export const getUserPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sortBy = req.query.sortBy as string || 'newest';

    // Finde User by username
    const [user] = await db
      .select({ 
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName
      })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Posts MIT Author-Informationen laden
    const offset = (page - 1) * limit;
    
    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        content: postsTable.content,
        contentType: postsTable.contentType,
        mediaIds: postsTable.mediaIds,
        hashtags: postsTable.hashtags,
        likeCount: postsTable.likeCount,
        commentCount: postsTable.commentCount,
        shareCount: postsTable.shareCount,
        createdAt: postsTable.createdAt,
        // Author-Informationen
        author: {
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          profileImage: profilesTable.avatarId
        },
        universe: {
          id: universesTable.id,
          name: universesTable.name,
          slug: universesTable.slug
        }
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
      .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
      .where(
        and(
          eq(postsTable.authorId, user.id),
          eq(postsTable.isDeleted, false)
        )
      )
      .orderBy(
        sortBy === 'newest' ? desc(postsTable.createdAt) :
        sortBy === 'oldest' ? asc(postsTable.createdAt) :
        sortBy === 'likes' ? desc(postsTable.likeCount) :
        desc(postsTable.createdAt)
      )
      .offset(offset)
      .limit(limit);

    const result = {
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit
      }
    };
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user posts'
    });
  }
};

// User Profil-Statistiken abrufen
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    // Finde User by username
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const stats = await UserService.getUserStats(user.id);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats'
    });
  }
};

// Freunde mit gemeinsamen Interessen
export const getFriendsWithCommonInterests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const friends = await UserService.getFriendsWithCommonInterests(req.user.id, limit);
    
    res.status(200).json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Get friends with common interests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends with common interests'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('🔍 Update Profile Request:', {
    userId: req.user?.id,
    body: JSON.stringify(req.body, null, 2),
    bodyKeys: Object.keys(req.body),
    contentType: req.headers['content-type']
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation Errors:', JSON.stringify(errors.array(), null, 2)); // ← Detaillierte Errors
    res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      message: 'Validation failed'
    });
    return;
  }

  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    console.log('📝 Calling UserService.updateProfile with:', req.body);

    const result = await UserService.updateProfile(req.user.id, req.body);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
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

// Message Settings abrufen
export const getMessageSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await ChatPermissionService.getUserMessageSettings(req.user.id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.settings
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get message settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get message settings'
    });
  }
};

// Message Settings aktualisieren
export const updateMessageSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { allowMessagesFrom } = req.body;
    
    const result = await ChatPermissionService.updateUserMessageSettings(req.user.id, allowMessagesFrom);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Message settings updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update message settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message settings'
    });
  }
};

// Helper-Funktionen für Array-Validation
const validateStringArray = (items: unknown[], fieldName: string, maxLength: number = 50): boolean => {
  if (!Array.isArray(items)) {
    throw new Error(`${fieldName} müssen ein Array sein`);
  }
  
  const validItems = items.every((item: unknown) => 
    typeof item === 'string' && 
    (item as string).trim().length > 0 && 
    (item as string).length <= maxLength
  );
  
  if (!validItems) {
    throw new Error(`Jeder ${fieldName} Eintrag muss ein Text zwischen 1-${maxLength} Zeichen sein`);
  }
  
  return true;
};

// VALIDATION RULES
export const updateProfileValidation = [
  body('displayName')
    .optional({ nullable: true, checkFalsy: false })
    .trim()
    .isLength({ min: 0, max: 100 })
    .withMessage('Display Name darf maximal 100 Zeichen haben'),
    
  body('firstName')
    .optional({ nullable: true, checkFalsy: false })
    .trim()
    .isLength({ min: 0, max: 50 })
    .withMessage('Vorname darf maximal 50 Zeichen haben'),
    
  body('lastName')
    .optional({ nullable: true, checkFalsy: false })
    .trim()
    .isLength({ min: 0, max: 50 })
    .withMessage('Nachname darf maximal 50 Zeichen haben'),
    
  body('bio')
    .optional({ nullable: true, checkFalsy: false })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio darf maximal 500 Zeichen haben'),
    
  body('website')
    .optional({ nullable: true, checkFalsy: false })
    .custom((value) => {
      // Leere Strings und null explizit erlauben
      if (!value || value === '' || value === null) {
        return true;
      }
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Ungültiges URL-Format');
      }
    }),
    
  body('socialLinks')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'object' && !Array.isArray(value)) return true;
      throw new Error('Social Links müssen ein Objekt sein');
    }),
    
  body('interests')
    .optional({ nullable: true })
    .isArray({ max: 10 })
    .withMessage('Interessen müssen ein Array mit maximal 10 Einträgen sein')
    .custom((interests) => {
      if (interests) {
        return validateStringArray(interests, 'Interesse');
      }
      return true;
    }),
    
  body('hobbies')
    .optional({ nullable: true })
    .isArray({ max: 10 })
    .withMessage('Hobbys müssen ein Array mit maximal 10 Einträgen sein')
    .custom((hobbies) => {
      if (hobbies) {
        return validateStringArray(hobbies, 'Hobby');
      }
      return true;
    }),
];

// Profil-Einstellungen Validation
export const updateSettingsValidation = [
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be boolean'),
  body('profileVisibility').optional().isIn(['public', 'friends', 'private']).withMessage('Invalid profile visibility'),
  body('locationVisibility').optional().isIn(['public', 'friends', 'private']).withMessage('Invalid location visibility'),
  body('searchRadius').optional().isInt({ min: 1, max: 500 }).withMessage('Search radius must be between 1 and 500 km'),
];

// Password Validation
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Validation Rules
export const updateMessageSettingsValidation = [
  body('allowMessagesFrom')
    .isIn(['everyone', 'universe_members', 'friends', 'none'])
    .withMessage('Invalid message setting. Must be one of: everyone, universe_members, friends, none')
];