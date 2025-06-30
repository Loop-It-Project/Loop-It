import { Request, Response } from 'express';
import { UniverseService } from '../services/universeService';
import { body, param, query, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const joinUniverse = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { universeSlug } = req.params;
    const userId = req.user!.id;

    const result = await UniverseService.joinUniverse(userId, universeSlug);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Join universe error:', error);
    const message = error instanceof Error ? error.message : 'Failed to join universe';
    res.status(400).json({ error: message });
  }
};

export const leaveUniverse = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { universeSlug } = req.params;
    const userId = req.user!.id;

    const result = await UniverseService.leaveUniverse(userId, universeSlug);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Leave universe error:', error);
    const message = error instanceof Error ? error.message : 'Failed to leave universe';
    res.status(400).json({ error: message });
  }
};

export const getUserUniverses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await UniverseService.getUserUniverses(userId, page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get user universes error:', error);
    res.status(500).json({ error: 'Failed to fetch user universes' });
  }
};

export const getUniverseDetails = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { universeSlug } = req.params;
    const userId = (req as AuthRequest).user?.id; // Optional - kann auch ohne Login aufgerufen werden

    const result = await UniverseService.getUniverseDetails(universeSlug, userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get universe details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch universe details';
    res.status(404).json({ error: message });
  }
};

export const getUniverseMembers = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { universeSlug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await UniverseService.getUniverseMembers(universeSlug, page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get universe members error:', error);
    res.status(500).json({ error: 'Failed to fetch universe members' });
  }
};

export const discoverUniverses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.id; // Optional
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await UniverseService.discoverUniverses(userId, category, page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Discover universes error:', error);
    res.status(500).json({ error: 'Failed to discover universes' });
  }
};

export const createUniverse = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const userId = req.user!.id;
    const universeData = req.body;

    const result = await UniverseService.createUniverse(userId, universeData);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create universe error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create universe';
    res.status(400).json({ error: message });
  }
};

// Validation rules
export const universeSlugValidation = [
  param('universeSlug').isSlug().withMessage('Invalid universe slug format'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const createUniverseValidation = [
  body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Universe name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Universe name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['technology', 'sports', 'music', 'art', 'gaming', 'cooking', 'travel', 'fitness', 'photography', 'books', 'movies', 'science', 'other'])
    .withMessage('Invalid category selected'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean'),
  body('allowImages')
    .optional()
    .isBoolean()
    .withMessage('allowImages must be a boolean'),
  body('allowPolls')
    .optional()
    .isBoolean()
    .withMessage('allowPolls must be a boolean'),
  body('minAgeRequirement')
    .optional()
    .isInt({ min: 13, max: 100 })
    .withMessage('Minimum age requirement must be between 13 and 100'),
  body('rules')
    .optional()
    .isArray()
    .withMessage('Rules must be an array'),
];