import { Router } from 'express';
import { getScore, updateScore } from '../controllers/score.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Authenticated read access for match score
router.get('/:matchId', getScore);

// ADMIN-ONLY write/update access for match score
router.post('/:matchId', verifyJWT, isAdmin, updateScore);
router.put('/:matchId', verifyJWT, isAdmin, updateScore);
router.patch('/:matchId', verifyJWT, isAdmin, updateScore);

export default router;
