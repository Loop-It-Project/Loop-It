import { Request, Response } from 'express';
import { FeedService } from '../services/feedService';
import { PostService } from '../services/postService';
import { query, param, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// Personal Feed - Für Dashboard
export const getPersonalFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return 
  }

  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sortBy = req.query.sortBy as string || 'newest';

    const result = await FeedService.getPersonalFeed(userId, page, limit, sortBy); 

    // Debug Log für den Personal Feed
    // console.log('✅ Personal Feed Result:', {
    //   postsCount: result.posts.length,
    //   firstPost: result.posts[0] ? {
    //     id: result.posts[0].id,
    //     likeCount: result.posts[0].likeCount,
    //     isLikedByUser: result.posts[0].isLikedByUser
    //   } : null
    // }); 
    
    res.status(200).json({
      success: true,
      data: {
        posts: result.posts,
        pagination: result.pagination
      },
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
export const getUniverseFeed = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return 
  }

  try {
    const { universeSlug } = req.params;
    const userId = (req as AuthRequest).user?.id || null; // ✅ null als Fallback
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sortBy = req.query.sortBy as string || 'newest'; 

    const result = await FeedService.getUniverseFeed(universeSlug, userId, page, limit, sortBy);
    
    res.status(200).json({
      success: true,
      data: {
        posts: result.posts,
        pagination: result.pagination
      },
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
export const getTrendingFeed = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return 
  }

  try {
    const timeframe = req.query.timeframe as string || '7d';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const page = parseInt(req.query.page as string) || 1;
    
    // User ID für Like-Status (optional)
    const userId = (req as AuthRequest).user?.id || null;

    // console.log(`🔥 Trending feed request:`, { timeframe, limit, page, userId: userId || 'anonymous' });

    const result = await FeedService.getTrendingFeed(timeframe, limit, page, userId);
    
    res.status(200).json({
      success: true,
      data: {
        posts: result.posts,
        pagination: result.pagination
      },
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
export const checkUniverseFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return 
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
export const getHashtagFeed = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return 
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
    .isInt({ min: 1, max: 100 })
    .withMessage('Page must be between 1 and 100'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'trending'])
    .withMessage('SortBy must be newest, oldest, or trending'),
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
    .isIn(['1h', '6h', '24h', '7d', '30d'])
    .withMessage('Timeframe must be one of: 1h, 6h, 24h, 7d, 30d'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page must be between 1 and 100'),
];