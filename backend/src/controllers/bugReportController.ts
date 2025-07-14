import { Request, Response } from 'express';
import { BugReportService } from '../services/bugReportService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string; role?: string };
}

// ✅ Create Bug Report
export const createBugReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, error: 'Title and description are required' });
      return;
    }

    // Get browser info from headers
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';

    // Automatically capture browser/system info
    const browserInfo = JSON.stringify({
      userAgent,
      referer,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    });

    const bugReportData = {
      title,
      description,
      reporterId: req.user?.id || '',
      reporterEmail: req.user?.email,
      category,
      priority,
      browserInfo,
      userAgent,
      currentUrl: referer,
      screenResolution: req.body.screenResolution // If provided by frontend
    };

    const result = await BugReportService.createBugReport(bugReportData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Bug report created successfully'
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Create bug report controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to create bug report' });
  }
};

// ✅ Get All Bug Reports (Admin only)
export const getAllBugReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📋 Getting all bug reports for admin:', req.user?.username);

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignedTo,
      search
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      priority: priority as string,
      category: category as string,
      assignedTo: assignedTo as string,
      search: search as string
    };

    const result = await BugReportService.getAllBugReports(filters);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Get all bug reports controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bug reports' });
  }
};

// ✅ Get Bug Report by ID
export const getBugReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await BugReportService.getBugReportById(id);

    if (result.success && result.data) {
      // Check if user can view this bug report
      if (req.user?.role !== 'admin' && req.user?.role !== 'developer' && 
          result.data.reporter.id !== req.user?.id) {
        res.status(403).json({ success: false, error: 'Not authorized to view this bug report' });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Get bug report controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bug report' });
  }
};

// ✅ Update Bug Report Status (Admin only)
export const updateBugReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📝 Updating bug report status for admin:', req.user?.username);

    const { id } = req.params;
    const { status, priority, category, assignedTo, adminNotes } = req.body;

    const updates = {
      status,
      priority,
      category,
      assignedTo,
      adminNotes
    };

    const result = await BugReportService.updateBugReportStatus(id, updates);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Bug report updated successfully'
      });
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Update bug report controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bug report' });
  }
};

// ✅ Delete Bug Report (Admin only)
export const deleteBugReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🗑️ Deleting bug report for admin:', req.user?.username);

    const { id } = req.params;

    const result = await BugReportService.deleteBugReport(id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Bug report deleted successfully'
      });
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Delete bug report controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete bug report' });
  }
};

// ✅ Get Bug Report Statistics (Admin only)
export const getBugReportStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📊 Getting bug report stats for admin:', req.user?.username);

    const result = await BugReportService.getBugReportStats();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Get bug report stats controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bug report stats' });
  }
};

// ✅ Get User's Bug Reports
export const getUserBugReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { page = 1, limit = 10 } = req.query;

    const result = await BugReportService.getUserBugReports(
      req.user.id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Get user bug reports controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user bug reports' });
  }
};