import express from 'express';
import { getUniverseByHashtag, searchHashtags } from '../controllers/hashtagController';
import { param, query } from 'express-validator';

const router = express.Router();

// Validation für Hashtag-Parameter
const hashtagValidation = [
  param('hashtag')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Hashtag must be alphanumeric and contain only underscores'),
];

// Validation für Hashtag-Suche
const searchValidation = [
  query('query')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
];

// Universe für Hashtag finden
router.get('/:hashtag/universe', hashtagValidation, getUniverseByHashtag);

// Hashtag-Suche
router.get('/search', searchValidation, searchHashtags);

export default router;