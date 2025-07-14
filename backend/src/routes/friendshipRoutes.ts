import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getUserFriends,
  getPendingRequests,
  getFriendshipStatus,
  sendFriendRequestValidation
} from '../controllers/friendshipController';

const router = Router();

// Freundschaftsanfrage senden
router.post('/request', auth, sendFriendRequestValidation, sendFriendRequest);

// Freundschaftsanfrage annehmen/ablehnen
router.put('/request/:requestId/accept', auth, acceptFriendRequest);
router.put('/request/:requestId/decline', auth, declineFriendRequest);

// Ausstehende Anfragen abrufen
router.get('/requests', auth, getPendingRequests);

// Freunde eines Users abrufen
router.get('/user/:username', getUserFriends);

// Freundschaftsstatus prüfen
router.get('/status/:username', auth, getFriendshipStatus);

// Freund entfernen
router.delete('/:username', auth, removeFriend);

export default router;