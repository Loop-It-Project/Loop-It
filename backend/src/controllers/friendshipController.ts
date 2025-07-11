import { Request, Response } from 'express';
import { FriendshipService } from '../services/friendshipService';
import { body, validationResult } from 'express-validator';
import { db } from '../db/connection';
import { usersTable } from '../db/Schemas';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Freundschaftsanfrage senden
export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { username } = req.body;
    const result = await FriendshipService.sendFriendRequest(req.user.id, username);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, error: 'Failed to send friend request' });
  }
};

// Freundschaftsanfrage annehmen
export const acceptFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { requestId } = req.params;
    const result = await FriendshipService.acceptFriendRequest(req.user.id, requestId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept friend request' });
  }
};

// Freundschaftsanfrage ablehnen
export const declineFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { requestId } = req.params;
    const result = await FriendshipService.declineFriendRequest(req.user.id, requestId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({ success: false, error: 'Failed to decline friend request' });
  }
};

// Freund entfernen
export const removeFriend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { username } = req.params;
    const result = await FriendshipService.removeFriend(req.user.id, username);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove friend' });
  }
};

// Freunde eines Users abrufen
export const getUserFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    // Finde User by username ZUERST
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Verwende User ID für FriendshipService
    const result = await FriendshipService.getUserFriends(user.id, page, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get user friends error:', error);
    res.status(500).json({ success: false, error: 'Failed to get friends' });
  }
};

// Ausstehende Freundschaftsanfragen abrufen
export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const result = await FriendshipService.getPendingRequests(req.user.id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to get pending requests' });
  }
};

// Freundschaftsstatus prüfen
export const getFriendshipStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { username } = req.params;
    const result = await FriendshipService.getFriendshipStatus(req.user.id, username);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get friendship status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get friendship status' });
  }
};

// Validation Rules
export const sendFriendRequestValidation = [
  body('username').trim().notEmpty().withMessage('Username is required')
];