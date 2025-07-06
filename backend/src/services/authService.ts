import bcrypt from 'bcryptjs';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { TokenService } from './tokenService';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
  error?: string;
}

export class AuthService {
  
  // USER REGISTRATION
  static async registerUser(data: RegisterData): Promise<AuthResult> {
    try {
      const { email, password, username, firstName, lastName } = data;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await db
        .insert(usersTable)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          username,
          displayName: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          emailVerifiedAt: null,
          accountStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create token pair
      const tokenPayload = {
        id: newUser[0].id,
        email: newUser[0].email,
        username: newUser[0].username
      };

      const tokenPair = await TokenService.createTokenPair(tokenPayload);

      const userData = {
        id: newUser[0].id,
        email: newUser[0].email,
        username: newUser[0].username,
        displayName: newUser[0].displayName,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName
      };

      // console.log('✅ Registration successful for user:', userData.username);

      return {
        success: true,
        user: userData,
        tokens: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn
        },
        message: 'Registration successful'
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // USER LOGIN
  static async loginUser(data: LoginData): Promise<AuthResult> {
    try {
      const { email, password } = data;
      
      // console.log('🔍 Login attempt for email:', `"${email}"`);

      // Find user with multiple strategies
      const foundUser = await this.findUserByEmail(email);

      if (!foundUser) {
        console.log('❌ User not found for email:', email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Password validation
      const isValidPassword = await bcrypt.compare(password, foundUser.passwordHash);
      // console.log('🔐 Password validation result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for email:', email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Create token pair
      const tokenPayload = {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username
      };

      const tokenPair = await TokenService.createTokenPair(tokenPayload);

      // Update last login
      await db
        .update(usersTable)
        .set({ lastLoginAt: new Date() })
        .where(eq(usersTable.id, foundUser.id));

      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        displayName: foundUser.displayName,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName
      };

      // console.log('✅ Login successful for user:', userData.username);

      return {
        success: true,
        user: userData,
        tokens: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn
        },
        message: 'Login successful'
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // FIND USER BY EMAIL (verschiedene Strategien)
  private static async findUserByEmail(email: string) {
    // Strategy 1: toLowerCase()
    let user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (user.length > 0) return user[0];

    // Strategy 2: Exact match
    user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length > 0) return user[0];

    // Strategy 3: Case-insensitive SQL
    user = await db
      .select()
      .from(usersTable)
      .where(sql`LOWER(${usersTable.email}) = LOWER(${email})`)
      .limit(1);

    return user.length > 0 ? user[0] : null;
  }

  // REFRESH TOKEN
  static async refreshUserTokens(refreshToken: string) {
    try {
      const newTokenPair = await TokenService.refreshTokenPair(refreshToken);
      // console.log('✅ Token refreshed successfully');

      return {
        success: true,
        tokens: {
          accessToken: newTokenPair.accessToken,
          refreshToken: newTokenPair.refreshToken,
          expiresIn: newTokenPair.expiresIn
        },
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      
      let errorMessage = 'Token refresh failed';
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          errorMessage = 'Refresh token expired';
        } else if (error.message.includes('revoked')) {
          errorMessage = 'Refresh token revoked';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Invalid refresh token';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // LOGOUT USER
  static async logoutUser(refreshToken?: string): Promise<AuthResult> {
    try {
      if (refreshToken) {
        const revoked = await TokenService.revokeRefreshToken(refreshToken);
        // console.log('🔓 Refresh token revoked:', revoked);
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Logout sollte immer erfolgreich sein
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  // LOGOUT FROM ALL DEVICES
  static async logoutUserFromAllDevices(userId: string, username: string): Promise<AuthResult> {
    try {
      const revokedCount = await TokenService.revokeAllUserTokens(userId);
      // console.log(`🔓 Revoked ${revokedCount} tokens for user ${username}`);

      return {
        success: true,
        message: `Logged out from all devices successfully (${revokedCount} sessions ended)`
      };
    } catch (error) {
      console.error('Logout all error:', error);
      return {
        success: false,
        error: 'Failed to logout from all devices'
      };
    }
  }
}