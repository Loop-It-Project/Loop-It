import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getPotentialMatches,
  processSwipe,
  getUserMatches,
  getSwipePreferences,
  updateSwipePreferences,
  getSwipeStats
} from '../controllers/swipeController';

const router = Router();

// Alle Swipe-Endpoints erfordern Authentication
router.use(auth);

// Potentielle Matches abrufen
router.get('/potential-matches', getPotentialMatches);

// Swipe-Aktion verarbeiten
router.post('/swipe', processSwipe);

// User-Matches abrufen
router.get('/matches', getUserMatches);

// Swipe-Präferenzen
router.get('/preferences', getSwipePreferences);
router.put('/preferences', updateSwipePreferences);

// Swipe-Statistiken
router.get('/stats', getSwipeStats);

export default router;