import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  paginationValidation,
  universeSlugValidation,
  createUniverseValidation,
  discoverUniverses, 
  createUniverse, 
  joinUniverse, 
  leaveUniverse, 
  getUserUniverses,
  getOwnedUniverses,
  getUniverseDetails,
  getUniverseMembers,
  deleteUniverse,
  transferOwnership,
  checkUniverseName
} from '../controllers/universeController';

const router = express.Router();

// Name-Verfügbarkeit prüfen
router.get(
  '/check-name', 
  checkUniverseName
);

// Universe Discovery (Public)
router.get(
  '/discover',
  paginationValidation,
  discoverUniverses
);

// User's eigene Universes
router.get(
    '/user/owned', 
    authenticateToken, 
    getOwnedUniverses
);

router.get(
  '/user', 
  authenticateToken, 
  getUserUniverses
);

router.get(
  '/:universeSlug/details',
  authenticateToken, 
  getUniverseDetails
);

// Get Universe Members (Public)
router.get(
  '/:universeSlug/members',
  authenticateToken,
  universeSlugValidation,
  paginationValidation,
  getUniverseMembers
);

// POST /api/universes/
router.post(
  '/',
  authenticateToken,
  createUniverseValidation,
  createUniverse
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

// Universe löschen (nur für Owner)
router.delete(
  '/:universeSlug', 
  authenticateToken, 
  deleteUniverse
);

// Eigentümerschaft übertragen (nur für Owner)
router.post(
  '/:universeSlug/transfer-ownership', 
  authenticateToken, 
  transferOwnership
);

export default router;