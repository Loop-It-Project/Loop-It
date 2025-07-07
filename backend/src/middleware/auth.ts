import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Auth-Middleware
export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        error: 'Access denied. No token provided.',
        errorCode: 'NO_TOKEN'
      });
      return;
    }

    // Token mit TokenService validieren
    const decoded = TokenService.verifyAccessToken(token);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    };

    // console.log('✅ Token validated for user:', decoded.username);
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    
    let errorMessage = 'Invalid token';
    let errorCode = 'INVALID_TOKEN';

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
      }
    }

    res.status(401).json({ 
      error: errorMessage,
      errorCode: errorCode
    });
  }
};

// Alternative Auth-Middleware für optionale Authentication
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = TokenService.verifyAccessToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username
        };
        // console.log('✅ Optional auth successful for user:', decoded.username);
      } catch (error) {
        console.log('⚠️ Optional auth failed, continuing without user');
        // Fehler ignorieren und ohne User fortfahren
      }
    }

    next();
  } catch (error) {
    console.error('❌ Optional auth middleware error:', error);
    next(); // Bei Fehlern trotzdem fortfahren
  }
};

export const authenticateToken = auth;