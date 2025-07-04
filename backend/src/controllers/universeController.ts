import { Request, Response } from 'express';
import { UniverseService } from '../services/universeService';
import { body, param, query, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// Universum beitreten
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

// Universum verlassen
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
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Leave universe error:', error);
    const message = error instanceof Error ? error.message : 'Failed to leave universe';
    
    // Detaillierte Error-Responses
    if (message.includes('creator cannot leave')) {
      res.status(400).json({ 
        success: false,
        error: message,
        errorCode: 'CREATOR_CANNOT_LEAVE'
      });
    } else if (message.includes('Not a member')) {
      res.status(404).json({ 
        success: false,
        error: message,
        errorCode: 'NOT_A_MEMBER'
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: message 
      });
    }
  }
};

// Universen des Nutzers abrufen
// Diese Funktion gibt alle Universen zurück, denen der Nutzer beigetreten ist
// oder die er erstellt hat. Die Ergebnisse werden paginiert.
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

// Details eines Universums abrufen
// Diese Funktion gibt Details zu einem bestimmten Universum zurück, einschließlich
// der Mitglieder, Beiträge und anderer relevanter Informationen.
export const getUniverseDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { universeSlug } = req.params;
    const userId = req.user?.id; // Optional - falls User eingeloggt

    console.log('🔍 Getting universe details for:', universeSlug, 'User:', userId); // Debug

    const universeDetails = await UniverseService.getUniverseDetails(universeSlug, userId);
    
    console.log('✅ Universe details retrieved:', universeDetails); // Debug
    
    res.status(200).json({
      success: true,
      data: universeDetails
    });
  } catch (error) {
    console.error('❌ Get universe details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get universe details';
    res.status(404).json({ 
      success: false,
      error: message 
    });
  }
};

// Details eines Universums abrufen
// Diese Funktion gibt Details zu einem bestimmten Universum zurück, einschließlich
// der Mitglieder, Beiträge und anderer relevanter Informationen.
export const getUniverseMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { universeSlug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await UniverseService.getUniverseMembers(universeSlug, page, limit);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get universe members error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get universe members';
    res.status(400).json({ 
      success: false,
      error: message 
    });
  }
};

// Universen entdecken
// Diese Funktion ermöglicht es Nutzern, neue Universen zu entdecken.
// Sie kann nach Kategorie gefiltert und paginiert werden.
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

// Universum erstellen
// Diese Funktion ermöglicht es Nutzern, ein neues Universum zu erstellen.
// Die erforderlichen Felder werden im Request-Body übergeben.
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

// User's eigene Universes abrufen
export const getOwnedUniverses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await UniverseService.getOwnedUniverses(userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Owned universes retrieved successfully'
    });
  } catch (error) {
    console.error('Get owned universes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve owned universes' 
    });
  }
};

// Universe löschen (Soft Delete)
export const deleteUniverse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { universeSlug } = req.params;
    const userId = req.user!.id;

    const result = await UniverseService.deleteUniverse(userId, universeSlug);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete universe error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete universe';
    res.status(400).json({ 
      success: false,
      error: message 
    });
  }
};

// Ownership übertragen
export const transferOwnership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { universeSlug } = req.params;
    const { newOwnerId } = req.body;
    const userId = req.user!.id;

    if (!newOwnerId) {
      res.status(400).json({ 
        success: false,
        error: 'New owner ID is required' 
      });
      return;
    }

    const result = await UniverseService.transferOwnership(userId, universeSlug, newOwnerId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    const message = error instanceof Error ? error.message : 'Failed to transfer ownership';
    res.status(400).json({ 
      success: false,
      error: message 
    });
  }
};

// Name-Eindeutigkeit prüfen
export const checkUniverseName = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name parameter is required' });
      return;
    }

    const exists = await UniverseService.checkUniverseNameExists(name);
    
    res.status(200).json({
      available: !exists,
      exists
    });
  } catch (error) {
    console.error('Check universe name error:', error);
    res.status(500).json({ error: 'Failed to check universe name' });
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