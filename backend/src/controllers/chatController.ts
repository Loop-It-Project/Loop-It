import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Conversation erstellen oder abrufen
export const getOrCreateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      res.status(400).json({ success: false, error: 'Target user ID is required' });
      return;
    }

    if (targetUserId === req.user.id) {
      res.status(400).json({ success: false, error: 'Cannot chat with yourself' });
      return;
    }

    const result = await ChatService.getOrCreateConversation(req.user.id, targetUserId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversation' });
  }
};

// Nachricht senden
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 =============SEND MESSAGE DEBUG=============');
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body (raw):', req.body);
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('🔍 Content-Type:', req.get('Content-Type'));
    console.log('🔍 Request user:', req.user);
    
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;
    
    console.log('🔍 Extracted params:', { conversationId, content, replyToId });
    
    // Validate input
    if (!content || content.trim() === '') {
      console.log('❌ Missing or empty content');
      res.status(400).json({ success: false, error: 'Message content is required' });
      return;
    }

    if (!conversationId) {
      console.log('❌ Missing conversationId');
      res.status(400).json({ success: false, error: 'Conversation ID is required' });
      return;
    }

    if (!req.user?.id) {
      console.log('❌ Missing user ID');
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    console.log('🔍 Calling ChatService.sendMessage with:', {
      conversationId,
      senderId: req.user.id,
      content: content.trim(),
      replyToId
    });

    const result = await ChatService.sendMessage(
      conversationId,
      req.user.id,
      content.trim(),
      replyToId
    );

    console.log('🔍 ChatService.sendMessage result:', result);

    if (result.success) {
      res.json(result);
    } else {
      console.log('❌ ChatService failed:', result.error);
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Send message controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Nachrichten abrufen
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await ChatService.getMessages(conversationId, req.user.id, page, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
};

// User's Conversations abrufen
export const getUserConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await ChatService.getUserConversations(req.user.id, page, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversations' });
  }
};

// Nachrichten als gelesen markieren
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;

    const result = await ChatService.markMessagesAsRead(conversationId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};

// Typing Indicator setzen
export const setTyping = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;

    // Direkte WebSocket-Übertragung
    const result = await ChatService.setTyping(conversationId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Set typing error:', error);
    res.status(500).json({ success: false, error: 'Failed to set typing' });
  }
};

// Typing Stop Controller hinzufügen
export const stopTyping = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;

    const result = await ChatService.stopTyping(conversationId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Stop typing error:', error);
    res.status(500).json({ success: false, error: 'Failed to stop typing' });
  }
};

// ✅ Conversation Stats Controller
export const getConversationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;

    const result = await ChatService.getConversationStats(conversationId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get conversation stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversation stats' });
  }
};

// Chat blockieren
export const blockConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { conversationId } = req.params;

    const result = await ChatService.toggleBlockConversation(conversationId, req.user.id, true);
    
    if (result.success) {
      res.status(200).json({ success: true, message: 'Conversation blocked' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Block conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to block conversation' });
  }
};