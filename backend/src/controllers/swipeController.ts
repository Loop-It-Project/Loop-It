import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SwipeService from '../services/swipeService';

// Potentielle Matches abrufen
export const getPotentialMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const result = await SwipeService.getPotentialMatches(req.user.id, limit);

    if (result.success) {
      res.json({
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
    console.error('Swipe controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load potential matches'
    });
  }
};

// Swipe-Aktion verarbeiten
export const processSwipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { targetId, action } = req.body;

    // Validation
    if (!targetId || !action) {
      res.status(400).json({
        success: false,
        error: 'Target ID and action are required'
      });
      return;
    }

    if (!['like', 'skip', 'super_like'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: like, skip, or super_like'
      });
      return;
    }

    // Prüfen ob User sich nicht selbst swipet
    if (req.user.id === targetId) {
      res.status(400).json({
        success: false,
        error: 'Cannot swipe on yourself'
      });
      return;
    }

    const result = await SwipeService.processSwipe(req.user.id, targetId, action);

    if (result.success) {
      res.json({
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
    console.error('Process swipe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process swipe'
    });
  }
};

// User-Matches abrufen
export const getUserMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const result = await SwipeService.getUserMatches(req.user.id, limit);

    if (result.success) {
      res.json({
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
    console.error('Get user matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load matches'
    });
  }
};

// Swipe-Präferenzen abrufen
export const getSwipePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const preferences = await SwipeService.getUserPreferences(req.user.id);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Get swipe preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load preferences'
    });
  }
};

// Swipe-Präferenzen aktualisieren
export const updateSwipePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const preferences = req.body;
    const result = await SwipeService.updateSwipePreferences(req.user.id, preferences);

    if (result.success) {
      res.json({
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
    console.error('Update swipe preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
};

// Swipe-Statistiken abrufen
export const getSwipeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await SwipeService.getSwipeStats(req.user.id);

    if (result.success) {
      res.json({
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
    console.error('Get swipe stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load stats'
    });
  }
};