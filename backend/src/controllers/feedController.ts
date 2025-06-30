import { Request, Response } from 'express';
import { FeedService } from '../services/feedService';
import { query, param, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// Personal Feed - Für Dashboard
export const getPersonalFeed = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await FeedService.getPersonalFeed(userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Personal feed retrieved successfully'
    });
  } catch (error) {
    console.error('Get personal feed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch personal feed';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Universe Feed - Für Universe-spezifische Seiten
export const getUniverseFeed = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { universeSlug } = req.params;
    const userId = (req as AuthRequest).user?.id; // Optional für nicht-eingeloggte User
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await FeedService.getUniverseFeed(universeSlug, userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Universe feed retrieved successfully'
    });
  } catch (error) {
    console.error('Get universe feed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch universe feed';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Trending Feed - Für Entdecken-Seite
export const getTrendingFeed = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const timeframe = req.query.timeframe as string || '24h';
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await FeedService.getTrendingFeed(timeframe, limit);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Trending feed retrieved successfully'
    });
  } catch (error) {
    console.error('Get trending feed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch trending feed';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Check if user follows a universe
export const checkUniverseFollowing = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { universeId } = req.params;
    const userId = req.user!.id;

    const isFollowing = await FeedService.isFollowingUniverse(userId, universeId);
    
    res.status(200).json({
      success: true,
      data: { isFollowing },
      message: 'Universe following status retrieved successfully'
    });
  } catch (error) {
    console.error('Check universe following error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check universe following status' 
    });
  }
};

// Feed für spezifische Hashtags (für später)
export const getHashtagFeed = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { hashtag } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // TODO: Implementiere Hashtag-spezifischen Feed
    // Vorerst placeholder
    res.status(501).json({ 
      success: false, 
      error: 'Hashtag feed not implemented yet',
      message: `Hashtag feed for #${hashtag} will be available soon`
    });
  } catch (error) {
    console.error('Get hashtag feed error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hashtag feed' 
    });
  }
};

// Validation rules
export const feedPaginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

export const universeSlugValidation = [
  param('universeSlug')
    .isSlug()
    .withMessage('Invalid universe slug format'),
];

export const universeIdValidation = [
  param('universeId')
    .isUUID()
    .withMessage('Invalid universe ID format'),
];

export const hashtagValidation = [
  param('hashtag')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Hashtag must be alphanumeric and contain only underscores'),
];

export const trendingValidation = [
  query('timeframe')
    .optional()
    .isIn(['1h', '6h', '24h', '7d'])
    .withMessage('Timeframe must be one of: 1h, 6h, 24h, 7d'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
];