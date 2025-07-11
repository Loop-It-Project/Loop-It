import { Router } from 'express';
import { 
  getOrCreateConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  markAsRead,
  setTyping,
  stopTyping,
  getConversationStats,
  blockConversation
} from '../controllers/chatController';
import { auth } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const sendMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('Reply to ID must be a valid UUID')
];

const createConversationValidation = [
  body('targetUserId')
    .isUUID()
    .withMessage('Target user ID must be a valid UUID')
];

// Routes
router.post('/conversations', auth, createConversationValidation, getOrCreateConversation);
router.get('/conversations', auth, getUserConversations);
router.get('/conversations/:conversationId/messages', auth, getMessages);
router.post('/conversations/:conversationId/messages', auth, sendMessageValidation, sendMessage);
router.put('/conversations/:conversationId/read', auth, markAsRead);

// Typing Indicators
router.post('/conversations/:conversationId/typing', auth, setTyping);
router.delete('/conversations/:conversationId/typing', auth, stopTyping); 

// Conversation Management
router.get('/conversations/:conversationId/stats', auth, getConversationStats); 
router.put('/conversations/:conversationId/block', auth, blockConversation);


export default router;