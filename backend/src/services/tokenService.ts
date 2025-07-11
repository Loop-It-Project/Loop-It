import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/connection';
import { refreshTokensTable, usersTable } from '../db/Schemas';
import { eq, and, lt } from 'drizzle-orm';

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  
  // Access Token erstellen (kurze Lebensdauer)
  static createAccessToken(payload: TokenPayload): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Options als separates Objekt
    const options: jwt.SignOptions = {
      expiresIn: 900, // 15 Minuten (900 Sekunden)
      issuer: 'loop-it-api',
      audience: 'loop-it-frontend',
      subject: payload.id
    };

    return jwt.sign(payload, jwtSecret, options);
  }

  // Refresh Token erstellen (lange Lebensdauer)
  static async createRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    
    // 7 Tage hinzufügen
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      // Refresh Token in DB speichern (ohne revokedAt)
      await db.insert(refreshTokensTable).values({
        token: refreshToken,
        userId,
        expiresAt,
        createdAt: new Date(),
        isRevoked: false
      });

      return refreshToken;
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw new Error('Failed to create refresh token');
    }
  }

  // Token-Paar erstellen (Access + Refresh)
  static async createTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = this.createAccessToken(payload);
    const refreshToken = await this.createRefreshToken(payload.id);
    
    // Expires in Sekunden berechnen
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN?.replace(/\D/g, '') || '900'); // 15 min = 900 sec
    
    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  // Access Token validieren
  static verifyAccessToken(token: string): TokenPayload {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      console.log('🔍 JWT decoded payload:', {
        fullPayload: JSON.stringify(decoded, null, 2),
        id: decoded.id,
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        iat: decoded.iat,
        exp: decoded.exp
      });

      // Prüfe ob es id oder userId ist
      if (!decoded.id && decoded.userId) {
        console.log('🔍 Converting userId to id');
        decoded.id = decoded.userId;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  // Refresh Token validieren und neues Token-Paar erstellen
  static async refreshTokenPair(refreshToken: string): Promise<TokenPair> {
    try {
      // Refresh Token in DB suchen
      const tokenRecord = await db
        .select({
          userId: refreshTokensTable.userId,
          expiresAt: refreshTokensTable.expiresAt,
          isRevoked: refreshTokensTable.isRevoked
        })
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.token, refreshToken))
        .limit(1);

      if (tokenRecord.length === 0) {
        throw new Error('Refresh token not found');
      }

      const token = tokenRecord[0];

      // Prüfen ob Token abgelaufen oder widerrufen
      if (token.isRevoked) {
        throw new Error('Refresh token is revoked');
      }

      if (new Date() > token.expiresAt) {
        throw new Error('Refresh token expired');
      }

      // User-Daten laden
      const user = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          username: usersTable.username
        })
        .from(usersTable)
        .where(eq(usersTable.id, token.userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Alten Refresh Token widerrufen
      await db
        .update(refreshTokensTable)
        .set({ 
          isRevoked: true,
          revokedAt: new Date()
        })
        .where(eq(refreshTokensTable.token, refreshToken));

      // Neues Token-Paar erstellen
      const tokenPayload: TokenPayload = {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username
      };

      return await this.createTokenPair(tokenPayload);

    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Alle Refresh Tokens eines Users widerrufen (Logout from all devices)
  static async revokeAllUserTokens(userId: string): Promise<number> {
    try {
      const result = await db
        .update(refreshTokensTable)
        .set({ 
          isRevoked: true,
          revokedAt: new Date()
        })
        .where(
          and(
            eq(refreshTokensTable.userId, userId),
            eq(refreshTokensTable.isRevoked, false)
          )
        );

      // console.log(`🔐 Revoked all tokens for user ${userId}`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      throw error;
    }
  }

  // Einzelnen Refresh Token widerrufen (Logout)
  static async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const result = await db
        .update(refreshTokensTable)
        .set({ 
          isRevoked: true,
          revokedAt: new Date()
        })
        .where(eq(refreshTokensTable.token, refreshToken));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  // Abgelaufene Tokens aufräumen
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await db
        .delete(refreshTokensTable)
        .where(
          lt(refreshTokensTable.expiresAt, now)
        );

      const deletedCount = result.rowCount || 0;
      // console.log(`🧹 Cleaned up ${deletedCount} expired refresh tokens`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  // Token-Info abrufen (für Debugging)
  static async getTokenInfo(refreshToken: string) {
    try {
      const tokenRecord = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.token, refreshToken))
        .limit(1);

      return tokenRecord.length > 0 ? tokenRecord[0] : null;
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }
}