import { Router } from 'express';
import { submitRegistration } from '../controllers/registration.controller.js';
import { registrationValidation } from '../middlewares/validate.middleware.js';
import { uploadPaymentProof } from '../utils/upload.js';
import { optionalVerifyJWT, isUserOnly } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/',
  optionalVerifyJWT,
  isUserOnly,
  uploadPaymentProof.single('paymentProof'),
  registrationValidation,
  submitRegistration
);

export default router;
