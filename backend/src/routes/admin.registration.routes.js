import { Router } from 'express';
import {
  listRegistrations,
  getSingleRegistration,
  verifyPaymentHandler,
  rejectPaymentHandler,
  approveRegistrationHandler,
  rejectRegistrationHandler,
  deleteRegistrationHandler,
} from '../controllers/registration.controller.js';
import {
  registrationQueryValidation,
  mongoIdParam,
  rejectionReasonValidation,
} from '../middlewares/validate.middleware.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT, isAdmin);

router.get('/', registrationQueryValidation, listRegistrations);
router.get('/:id', mongoIdParam('id'), getSingleRegistration);
router.delete('/:id', mongoIdParam('id'), deleteRegistrationHandler);
router.post('/:id/delete', mongoIdParam('id'), deleteRegistrationHandler);
router.patch('/:id/verify-payment', mongoIdParam('id'), verifyPaymentHandler);
router.post('/:id/verify-payment', mongoIdParam('id'), verifyPaymentHandler);

router.patch(
  '/:id/reject-payment',
  mongoIdParam('id'),
  rejectionReasonValidation,
  rejectPaymentHandler
);
router.post(
  '/:id/reject-payment',
  mongoIdParam('id'),
  rejectionReasonValidation,
  rejectPaymentHandler
);

router.patch('/:id/approve', mongoIdParam('id'), approveRegistrationHandler);
router.post('/:id/approve', mongoIdParam('id'), approveRegistrationHandler);

router.patch(
  '/:id/reject',
  mongoIdParam('id'),
  rejectionReasonValidation,
  rejectRegistrationHandler
);
router.post(
  '/:id/reject',
  mongoIdParam('id'),
  rejectionReasonValidation,
  rejectRegistrationHandler
);

export default router;
