import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminService } from '../services/adminService';

// Dashboard Metriken abrufen
export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // ✅ Optional chaining
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const result = await AdminService.getDashboardMetrics();
    
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
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics'
    });
  }
};

// Alle User abrufen
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // ✅ Optional chaining
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';

    const result = await AdminService.getAllUsers(page, limit, search, role);
    
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
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Moderation Reports abrufen
export const getModerationReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // ✅ Optional chaining
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || 'pending';

    const result = await AdminService.getModerationReports(page, limit, status);
    
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
    console.error('Get moderation reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get moderation reports'
    });
  }
};

// Universe Moderator zuweisen
export const assignUniverseModerator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // ✅ Optional chaining
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { universeId, targetUserId } = req.body;

    if (!universeId || !targetUserId) {
      res.status(400).json({
        success: false,
        error: 'Universe ID and User ID are required'
      });
      return;
    }

    const result = await AdminService.assignUniverseModerator(universeId, targetUserId, userId);
    
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
    console.error('Assign universe moderator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign moderator'
    });
  }
};

// Pending Approvals abrufen
export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // ✅ Optional chaining
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const result = await AdminService.getPendingApprovals();
    
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
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending approvals'
    });
  }
};