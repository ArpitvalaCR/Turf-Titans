import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../controllers/auth.controller.js';
import {
  registerValidation,
  verifyOtpValidation,
  resendOtpValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../middlewares/validate.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/verify-otp', verifyOtpValidation, verifyOtp);
router.post('/resend-otp', resendOtpValidation, resendOtp);
router.post('/login', loginValidation, login);
router.post('/google', googleAuth);
router.post('/logout', verifyJWT, logout);
router.post('/refresh', refresh);
router.get('/me', verifyJWT, me);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, resetPassword);

export default router;
