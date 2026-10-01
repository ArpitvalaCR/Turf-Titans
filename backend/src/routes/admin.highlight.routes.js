import { Router } from 'express';
import {
  listAdminHighlights,
  createHighlightHandler,
  updateHighlightHandler,
  deleteHighlightHandler,
} from '../controllers/highlight.controller.js';
import {
  highlightValidation,
  mongoIdParam,
} from '../middlewares/validate.middleware.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadMedia } from '../utils/upload.js';

const router = Router();

router.use(verifyJWT, isAdmin);

router.get('/', listAdminHighlights);
router.post('/', uploadMedia.single('media'), highlightValidation, createHighlightHandler);
router.patch(
  '/:id',
  mongoIdParam('id'),
  uploadMedia.single('media'),
  highlightValidation,
  updateHighlightHandler
);
router.delete('/:id', mongoIdParam('id'), deleteHighlightHandler);

export default router;
