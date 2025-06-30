import express from 'express';
import { getUniverseByHashtag } from '../controllers/hashtagController';

const router = express.Router();

router.get('/:hashtag/universe', getUniverseByHashtag);

export default router;