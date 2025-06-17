// src/routes/searchRoutes.ts
import { Router } from 'express';
import { SearchController } from '../controllers/searchController';

const router = Router();
const searchController = new SearchController();

// Search endpoints
router.get('/search', searchController.search);
router.get('/trending', searchController.trending);
router.get('/suggestions', searchController.suggestions);

export default router;