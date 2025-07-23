import express from 'express';
import { auth } from '../middleware/auth';
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

// Statische Routes zuerst, dann dynamische
// Name-Verfügbarkeit prüfen (statisch)
router.get('/check-name', checkUniverseName);

// Universe Discovery (statisch)
router.get('/discover', auth, paginationValidation, discoverUniverses);

// User-spezifische Routes (statisch)
router.get('/user/owned', auth, paginationValidation, getOwnedUniverses); 
router.get('/user/my-universes', auth, paginationValidation, getUserUniverses);
router.get('/user', auth, getUserUniverses);

// Universe erstellen (statisch)
router.post('/', auth, createUniverseValidation, createUniverse);

// DYNAMISCHE Routes am Ende (diese könnten das Problem verursachen)
// Universe Details
router.get('/:universeSlug/details', auth, universeSlugValidation, getUniverseDetails);

// Universe Members
router.get('/:universeSlug/members', auth, universeSlugValidation, paginationValidation, getUniverseMembers);

// Join Universe
router.post('/:universeSlug/join', auth, joinUniverse);

// Leave Universe
router.post('/:universeSlug/leave', auth, leaveUniverse);

// Universe löschen
router.delete('/:universeSlug', auth, universeSlugValidation, deleteUniverse);

// Ownership übertragen
router.post('/:universeSlug/transfer-ownership', auth, universeSlugValidation, transferOwnership);

export default router;