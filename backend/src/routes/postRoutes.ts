import { Router } from 'express';
import { createPost, deletePost, likePost } from '../controllers/postController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const createPostValidation = [
  body('content').notEmpty().withMessage('Content is required'),
  body('universeId').isUUID().withMessage('Valid universe ID is required'),
  body('title').optional().isLength({ max: 255 }).withMessage('Title too long'),
  body('hashtags').optional().isArray().withMessage('Hashtags must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean')
];

// Post routes
router.post('/', authenticateToken, createPostValidation, createPost);
router.delete('/:postId', authenticateToken, deletePost);
router.post('/:postId/like', authenticateToken, likePost);

export default router;