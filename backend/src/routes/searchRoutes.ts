// src/routes/searchRoutes.ts
import { Router } from 'express';
import { 
    search, 
    trending, 
    getSearchHistory, 
    deleteSearchHistoryItem, 
    clearSearchHistory 
} from '../controllers/searchController';
import { optionalAuth, auth } from '../middleware/auth';

const router = Router();

// Search endpoints
router.get('/', optionalAuth, search);
router.get('/trending', trending);
//router.get('/suggestions', searchController.suggestions);

// Search History endpoints (erfordern Authentication)
router.get('/history', auth, getSearchHistory);
router.delete('/history/:historyId', auth, deleteSearchHistoryItem);
router.delete('/history', auth, clearSearchHistory);

export default router;