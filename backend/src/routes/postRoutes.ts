import { Router } from 'express';
import { 
  createPost, 
  deletePost, 
  togglePostLike,
  addComment,
  getPostComments,
  getPostLikeStatus,
  toggleCommentLike,
  addCommentReply,
  getCommentReplies,
  sharePost,
  getShareStatistics,
  getTrendingShares
} from '../controllers/postController';
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
router.post('/:postId/like', authenticateToken, togglePostLike);
router.get('/:postId/like-status', authenticateToken, getPostLikeStatus);

// ✅ Comment-spezifische Routes
router.post('/:postId/comments', 
  authenticateToken,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment content must be between 1 and 1000 characters'),
    body('parentId')
      .optional({ values: 'null' }) // ✅ Erlaubt explizit null-Werte
      .custom((value) => {
        if (value === null || value === undefined) {
          return true; // null/undefined sind OK
        }
        // Nur validieren wenn Wert vorhanden ist
        if (typeof value === 'string' && value.length > 0) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            throw new Error('Parent ID must be a valid UUID');
          }
        }
        return true;
      })
  ],
  addComment
);
router.get('/:postId/comments', authenticateToken, getPostComments);
router.post('/:postId/comments/:commentId/like', authenticateToken, toggleCommentLike);
router.post('/:postId/comments/:commentId/replies', 
  authenticateToken,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Reply content must be between 1 and 1000 characters')
  ],
  addCommentReply
);
router.get('/comments/:commentId/replies', authenticateToken, getCommentReplies);

// Share routes
router.post('/:postId/share', 
  [
    body('shareType')
      .isIn(['internal', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link', 'email', 'native'])
      .withMessage('Invalid share type'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  sharePost
);
router.get('/:postId/share-statistics', getShareStatistics);
router.get('/trending-shares', getTrendingShares);

export default router;