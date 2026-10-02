import { Router } from 'express';
import {
  submitRegistration,
  getMyRegistrationsHandler,
  getRegistrationStatusHandler,
} from '../controllers/registration.controller.js';
import { registrationValidation } from '../middlewares/validate.middleware.js';
import { uploadPaymentProof } from '../utils/upload.js';
import { optionalVerifyJWT, isUserOnly, verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/',
  optionalVerifyJWT,
  isUserOnly,
  uploadPaymentProof.single('paymentProof'),
  registrationValidation,
  submitRegistration
);

// Protected: Only authenticated users can access their own registrations
router.get('/my-registrations', verifyJWT, getMyRegistrationsHandler);
router.get('/status/:identifier', verifyJWT, getRegistrationStatusHandler);

export default router;
