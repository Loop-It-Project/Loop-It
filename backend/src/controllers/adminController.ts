import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminAuthRequest } from '../middleware/adminAuth';
import { AdminService } from '../services/adminService';
import { UniverseService } from '../services/universeService';
import { universesTable } from '../db/Schemas';
import { db } from '../db/connection';

// Dashboard Metriken abrufen
export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) { // Optional chaining
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
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
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
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
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
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
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
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
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

// ALLE UNIVERSES ABRUFEN
export const getAllUniverses = async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Check admin permissions
    const permissionCheck = await AdminService.checkAdminPermissions(userId);
    if (!permissionCheck.success || !permissionCheck.data?.isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    
    const result = await AdminService.getAllUniverses(
      parseInt(page as string),
      parseInt(limit as string),
      search as string,
      status as string
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin getAllUniverses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get universes'
    });
  }
};

// Universe Status toggeln (geschlossen/aktiv)
export const toggleUniverseStatus = async (req: any, res: any): Promise<void> => {
  try {
    const { universeId } = req.params;
    const { isClosed } = req.body;
    const adminId = req.user.id;

    const result = await AdminService.toggleUniverseStatus(universeId, isClosed, adminId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin toggleUniverseStatus error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle universe status'
    });
  }
};

// Universe Aktivieren/Deaktivieren
export const toggleUniverseActive = async (req: any, res: any): Promise<void> => {
  try {
    const { universeId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user.id;

    const result = await AdminService.toggleUniverseActive(universeId, isActive, adminId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin toggleUniverseActive error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle universe active status'
    });
  }
};

// Universe Eigentümerschaft übertragen
export const transferUniverseOwnership = async (req: any, res: any): Promise<void> => {
  try {
    const { universeId } = req.params;
    const { newCreatorId } = req.body;
    const adminId = req.user.id;

    const result = await AdminService.transferUniverseOwnership(universeId, newCreatorId, adminId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin transferUniverseOwnership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer universe ownership'
    });
  }
};

// Universe löschen (Soft Delete)
export const deleteUniverse = async (req: any, res: any): Promise<void> => {
  try {
    const { universeId } = req.params;
    const adminId = req.user.id;

    const result = await AdminService.deleteUniverse(universeId, adminId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin deleteUniverse error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete universe'
    });
  }
};

// Universe wiederherstellen
export const restoreUniverse = async (req: any, res: any): Promise<void> => {
  try {
    const { universeId } = req.params;
    const adminId = req.user.id;

    const result = await AdminService.restoreUniverse(universeId, adminId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Admin restoreUniverse error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore universe'
    });
  }
};

// Controller zum Neuberechnen der Universe-Counter
export const recalculateAllUniverseCounters = async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    // Now TypeScript won't complain about isAdmin
    if (!req.user?.isAdmin) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    // Rest of your function remains the same
    const universes = await db.select({ id: universesTable.id }).from(universesTable);
    
    // Für jedes Universe die Counter neu berechnen
    const results = await Promise.all(
      universes.map(async (universe: { id: string }) => {
        const postResult = await UniverseService.recalculateUniversePostCount(universe.id);
        const memberResult = await UniverseService.recalculateUniverseMemberCount(universe.id);
        return { universeId: universe.id, postResult, memberResult };
      })
    );
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error recalculating universe counters:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};