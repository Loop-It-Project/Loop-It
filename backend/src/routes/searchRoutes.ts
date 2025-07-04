// src/routes/searchRoutes.ts
import { Router } from 'express';
import { search, trending } from '../controllers/searchController';

const router = Router();

// Search endpoints
router.get('/', search);
router.get('/trending', trending);
//router.get('/suggestions', searchController.suggestions);

export default router;