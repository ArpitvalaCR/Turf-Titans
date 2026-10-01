import { Router } from 'express';
import {
  listPublicEvents,
  getSinglePublicEvent,
  getEventRegistrationCount,
  getLiveStatusHandler,
} from '../controllers/event.controller.js';
import {
  eventQueryValidation,
  mongoIdParam,
} from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', eventQueryValidation, listPublicEvents);
router.get('/live-status', getLiveStatusHandler);
router.get(
  '/:eventId/registrations/count',
  mongoIdParam('eventId'),
  getEventRegistrationCount
);
router.get('/:id', mongoIdParam('id'), getSinglePublicEvent);

export default router;
