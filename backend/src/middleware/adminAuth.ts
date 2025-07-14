import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔒 AdminAuth: Checking admin permissions...');
    
    if (!req.user?.id) {
      console.log('❌ AdminAuth: No user in request');
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    console.log('🔍 AdminAuth: Checking permissions for user:', req.user.username);

    // Admin-Berechtigung prüfen
    const permissionCheck = await AdminService.checkAdminPermissions(req.user.id);
    
    console.log('🔍 AdminAuth: Permission check result:', permissionCheck);
    
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
      console.log('❌ AdminAuth: User is not admin');
      res.status(403).json({
        success: false,
        error: 'Admin access required',
        details: `User ${req.user.username} does not have admin permissions`
      });
      return;
    }

    // console.log('✅ AdminAuth: User has admin permissions');
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
};
