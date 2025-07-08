import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Admin-Berechtigung prüfen
    const permissionCheck = await AdminService.checkAdminPermissions(req.user.id);
    
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
};