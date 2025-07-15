import { Request, Response } from 'express';
import { AccountService } from '../services/accountService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Account deaktivieren
export const deactivateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { reason } = req.body;

    const result = await AccountService.deactivateAccount(req.user.id, reason);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account'
    });
  }
};

// Account reaktivieren
export const reactivateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await AccountService.reactivateAccount(req.user.id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Reactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate account'
    });
  }
};

// Account löschen
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { reason, confirmPassword } = req.body;

    // Hier könntest du zusätzlich das Passwort verifizieren
    if (!confirmPassword) {
      res.status(400).json({ 
        success: false, 
        error: 'Password confirmation required for account deletion' 
      });
      return;
    }

    const result = await AccountService.deleteAccount(req.user.id, reason);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        deletedUser: result.deletedUser
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
};

// Account Status abrufen
export const getAccountStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await AccountService.getAccountStatus(req.user.id);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get account status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get account status'
    });
  }
};

// Deletion Impact Report
export const getDeletionImpactReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await AccountService.getDeletionImpactReport(req.user.id);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to generate deletion impact report'
      });
    }
  } catch (error) {
    console.error('❌ Get deletion impact report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion impact report'
    });
  }
};