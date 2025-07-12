import { Request, Response } from 'express';
import { UniverseChatService } from '../services/universeChatService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Chat Room beitreten
export const joinUniverseChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { universeId } = req.params;

    const result = await UniverseChatService.joinChatRoom(universeId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Join universe chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to join chat' });
  }
};

// Chat Room verlassen
export const leaveUniverseChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { universeId } = req.params;

    const result = await UniverseChatService.leaveChatRoom(universeId, req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Leave universe chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to leave chat' });
  }
};

// Nachricht senden
export const sendUniverseChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { universeId } = req.params;
    const { content } = req.body;

    const result = await UniverseChatService.sendMessage(universeId, req.user.id, content);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Send universe chat message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Chat-Nachrichten abrufen
export const getUniverseChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { universeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await UniverseChatService.getChatMessages(universeId, req.user.id, page, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get universe chat messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
};

// Aktive Teilnehmer abrufen
export const getUniverseChatParticipants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { universeId } = req.params;

    const result = await UniverseChatService.getActiveParticipants(universeId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get universe chat participants error:', error);
    res.status(500).json({ success: false, error: 'Failed to get participants' });
  }
};

// Nachricht löschen (Moderation)
export const deleteUniverseChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { messageId } = req.params;
    const { reason } = req.body;

    const result = await UniverseChatService.deleteMessage(messageId, req.user.id, reason);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete universe chat message error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
};