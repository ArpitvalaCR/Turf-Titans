import { Router } from 'express';
import {
  listPublicHighlights,
  getSingleHighlight,
} from '../controllers/highlight.controller.js';
import { mongoIdParam } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', listPublicHighlights);
router.get('/:id', mongoIdParam('id'), getSingleHighlight);

export default router;
