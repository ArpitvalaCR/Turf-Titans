import { Router } from 'express';
import {
  listAdminEvents,
  getAdminEvent,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
  uploadRulebookHandler,
  deleteRulebookHandler,
} from '../controllers/event.controller.js';
import {
  eventValidation,
  eventQueryValidation,
  mongoIdParam,
} from '../middlewares/validate.middleware.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadImage, uploadPdf } from '../utils/upload.js';

const router = Router();

router.use(verifyJWT, isAdmin);

router.get('/', eventQueryValidation, listAdminEvents);
router.get('/:id', mongoIdParam('id'), getAdminEvent);
router.post('/', uploadImage.single('bannerImage'), eventValidation, createEventHandler);
router.patch(
  '/:id',
  mongoIdParam('id'),
  uploadImage.single('bannerImage'),
  eventValidation,
  updateEventHandler
);
router.post(
  '/:id/rulebook',
  mongoIdParam('id'),
  uploadPdf.single('rulebook'),
  uploadRulebookHandler
);
router.delete(
  '/:id/rulebook',
  mongoIdParam('id'),
  deleteRulebookHandler
);
router.delete('/:id', mongoIdParam('id'), deleteEventHandler);

export default router;
