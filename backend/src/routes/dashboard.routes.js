import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT, isAdmin);
router.get('/stats', getStats);

export default router;
