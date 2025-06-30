import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPersonalFeed,
  getUniverseFeed,
  getTrendingFeed,
  checkUniverseFollowing,
  getHashtagFeed,
  feedPaginationValidation,
  universeSlugValidation,
  universeIdValidation,
  hashtagValidation,
  trendingValidation
} from '../controllers/feedController';

const router = express.Router();

// Personal Feed Routes (Authentication required)
router.get(
  '/personal',
  authenticateToken,
  feedPaginationValidation,
  getPersonalFeed
);

// Universe Feed Routes
router.get(
  '/universe/:universeSlug',
  universeSlugValidation,
  feedPaginationValidation,
  getUniverseFeed
);

// Trending Feed Routes (Public)
router.get(
  '/trending',
  trendingValidation,
  getTrendingFeed
);

// Hashtag Feed Routes (Public, für später)
router.get(
  '/hashtag/:hashtag',
  hashtagValidation,
  feedPaginationValidation,
  getHashtagFeed
);

// Universe Following Check (Authentication required)
router.get(
  '/universe/:universeId/following',
  authenticateToken,
  universeIdValidation,
  checkUniverseFollowing
);

export default router;