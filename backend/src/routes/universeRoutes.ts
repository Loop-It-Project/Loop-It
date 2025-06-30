import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    joinUniverse,
    leaveUniverse,
    getUserUniverses,
    getUniverseDetails,
    getUniverseMembers,
    discoverUniverses,
    universeSlugValidation,
    paginationValidation,
    createUniverse,
    createUniverseValidation,
    getOwnedUniverses
} from '../controllers/universeController';

const router = express.Router();

// Universe Discovery (Public)
router.get(
  '/discover',
  paginationValidation,
  discoverUniverses
);

// Get Universe Details (Public, aber mit optionalem User Context)
router.get(
  '/:universeSlug',
  universeSlugValidation,
  getUniverseDetails
);

// Get Universe Members (Public)
router.get(
  '/:universeSlug/members',
  universeSlugValidation,
  paginationValidation,
  getUniverseMembers
);

// User-specific Universe Routes (Authentication required)
router.get(
  '/user/my-universes',
  authenticateToken,
  paginationValidation,
  getUserUniverses
);

// Join Universe (Authentication required)
router.post(
  '/:universeSlug/join',
  authenticateToken,
  universeSlugValidation,
  joinUniverse
);

// Leave Universe (Authentication required)
router.delete(
  '/:universeSlug/leave',
  authenticateToken,
  universeSlugValidation,
  leaveUniverse
);

// POST /api/universes/
router.post(
  '/',
  authenticateToken,
  createUniverseValidation,
  createUniverse
);

// User's eigene Universes
router.get(
    '/user/owned', 
    authenticateToken, 
    getOwnedUniverses
);

export default router;