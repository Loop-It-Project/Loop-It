import { Router } from 'express';
import { 
  joinUniverseChat,
  leaveUniverseChat,
  sendUniverseChatMessage,
  getUniverseChatMessages,
  getUniverseChatParticipants,
  deleteUniverseChatMessage
} from '../controllers/universeChatController';
import { auth } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Universe Chat Routes
router.post('/:universeId/join', auth, joinUniverseChat);
router.post('/:universeId/leave', auth, leaveUniverseChat);
router.get('/:universeId/messages', auth, getUniverseChatMessages);
router.get('/:universeId/participants', auth, getUniverseChatParticipants);

// Send message with validation
router.post('/:universeId/messages', 
  auth, 
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message content must be between 1 and 500 characters')
  ], 
  sendUniverseChatMessage
);

// Moderation
router.delete('/messages/:messageId', 
  auth, 
  [
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Reason must not exceed 200 characters')
  ], 
  deleteUniverseChatMessage
);

export default router;