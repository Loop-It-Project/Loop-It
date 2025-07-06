import { Request, Response } from 'express';
import { validationResult, body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { 
  usersTable, 
  rolesTable, 
  userRolesTable, 
  profilesTable, 
  refreshTokensTable 
} from '../db/schema';
import { eq, or } from 'drizzle-orm';
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Prüfen ob User bereits existiert
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.email, email), eq(usersTable.username, username)))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Email or username already exists'
      });
      return;
    }

    // Password hashen
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // User erstellen
    const newUser = await db
      .insert(usersTable)
      .values({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        passwordHash,
        displayName: `${firstName} ${lastName}`.trim(),
        accountStatus: 'active',
        emailNotifications: true,
        pushNotifications: true,
        locationVisibility: 'public',
        searchRadius: 50,
        lastLoginAt: new Date(),
        premiumTier: 'free'
      })
      .returning();

    if (newUser.length === 0) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
      return;
    }

    const user = newUser[0];

    // DEFAULT USER ROLE ZUWEISEN
    try {
      console.log('🎯 Assigning default user role...');
      
      // 1. Prüfe ob 'user' Rolle existiert, wenn nicht erstelle sie
      let userRole = await db
        .select()
        .from(rolesTable)
        .where(eq(rolesTable.name, 'user'))
        .limit(1);

      if (userRole.length === 0) {
        console.log('📝 Creating default "user" role...');
        // Erstelle Standard 'user' Rolle
        const createdRole = await db
          .insert(rolesTable)
          .values({
            name: 'user',
            description: 'Standard Benutzer',
            permissions: JSON.stringify([
              'read_posts', 
              'create_posts', 
              'join_universes', 
              'create_universes',
              'comment_posts',
              'react_posts',
              'send_messages'
            ]),
            isActive: true,
            isDefault: true
          })
          .returning();
        
        userRole = createdRole;
        console.log('✅ Standard "user" role created');
      }

      // 2. User-Role Zuordnung erstellen
      await db
        .insert(userRolesTable)
        .values({
          userId: user.id,
          roleId: userRole[0].id,
          isActive: true,
          assignedBy: null, // System assignment
          assignedAt: new Date()
        });

      // console.log('✅ User role assigned to:', user.username);

    } catch (roleError) {
      console.error('⚠️ Fehler beim Zuweisen der User-Rolle:', roleError);
      // Nicht kritisch - User kann trotzdem erstellt werden
    }

    // PROFILE ERSTELLEN
    try {
      await db
        .insert(profilesTable)
        .values({
          userId: user.id,
          bio: null,
          profileVisibility: 'public',
          showAge: false,
          showLocation: true,
          allowMessagesFrom: 'everyone',
          profileViews: 0,
          friendsCount: 0,
          postsCount: 0
        });

      // console.log('✅ Profile created for:', user.username);
    } catch (profileError) {
      console.error('⚠️ Fehler beim Erstellen des Profils:', profileError);
      // Nicht kritisch, aber sollte behoben werden
    }

    // JWT Token generieren
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Refresh Token generieren
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Refresh Token in DB speichern
    await db
      .insert(refreshTokensTable)
      .values({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
      });

    // User-Daten für Response aufbereiten
    const { passwordHash: _, ...userResponse } = user;

    console.log('🎉 Registration completed successfully for:', user.username);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      refreshToken,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  // console.log('🔍 Login route called with body:', Object.keys(req.body));
  
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