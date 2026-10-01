import { Router } from 'express';
import {
  setupMatch,
  getMatchSession,
  getLiveMatchesList,
  resetMatchStart,
  acquireLock,
  heartbeatLock,
  releaseLock,
  recordDelivery,
  undoDelivery,
  swapStrike,
  changeBowler,
  substitutePlayer,
  startSecondInnings,
  endMatch,
} from '../controllers/matchSession.controller.js';
import { verifyJWT, isAdmin, optionalVerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Realtime Read Routes (place /live before /:matchId/session)
router.get('/live', getLiveMatchesList);
router.get('/:matchId/session', optionalVerifyJWT, getMatchSession);

// Admin-Only Scoring & Lock Routes
router.post('/:matchId/setup', verifyJWT, isAdmin, setupMatch);
router.post('/:matchId/reset-start', verifyJWT, isAdmin, resetMatchStart);
router.post('/:matchId/lock/acquire', verifyJWT, isAdmin, acquireLock);
router.post('/:matchId/lock/heartbeat', verifyJWT, isAdmin, heartbeatLock);
router.post('/:matchId/lock/release', verifyJWT, isAdmin, releaseLock);
router.post('/:matchId/deliveries', verifyJWT, isAdmin, recordDelivery);
router.post('/:matchId/undo', verifyJWT, isAdmin, undoDelivery);
router.post('/:matchId/strike/swap', verifyJWT, isAdmin, swapStrike);
router.post('/:matchId/bowler/change', verifyJWT, isAdmin, changeBowler);
router.post('/:matchId/substitute', verifyJWT, isAdmin, substitutePlayer);
router.post('/:matchId/innings/start-second', verifyJWT, isAdmin, startSecondInnings);
router.post('/:matchId/end', verifyJWT, isAdmin, endMatch);

export default router;
