import { body, param, query, validationResult } from 'express-validator';
import { SPORTS, EVENT_STATUSES, MEDIA_TYPES } from '../constants/index.js';
import ApiError from '../utils/ApiError.js';

export const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  next();
};

export const registerValidation = validate([
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
]);

export const verifyOtpValidation = validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required'),
]);

export const resendOtpValidation = validate([
  body('email').isEmail().withMessage('Valid email is required'),
]);

export const loginValidation = validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]);

export const eventValidation = validate([
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('sport').optional().customSanitizer(v => v ? v.toString().toLowerCase().trim() : v).isIn(SPORTS).withMessage('Invalid sport'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('registrationStartDate')
    .isISO8601()
    .withMessage('Valid registration start date is required'),
  body('registrationEndDate')
    .isISO8601()
    .withMessage('Valid registration end date is required'),
  body('registrationFee').isFloat({ min: 0 }).withMessage('Valid registration fee is required'),
  body('maxTeams').isInt({ min: 1 }).withMessage('Max teams must be at least 1'),
  body('prizes').trim().notEmpty().withMessage('Prizes field is required'),
  body('status').optional().isIn(EVENT_STATUSES).withMessage('Invalid status'),
  body('rules').optional().isString(),
]);

export const registrationValidation = validate([
  body('teamName').trim().notEmpty().withMessage('Team name is required'),
  body('captainName').trim().notEmpty().withMessage('Captain name is required'),
  body('captainEmail').isEmail().withMessage('Valid email is required'),
  body('captainPhone').optional().isString(),
  body('whatsappNumber').optional().isString(),
  body('department').optional().isString(),
  body('sport').optional().isString(),
  body('message').optional().isString(),
  body('eventId').optional().customSanitizer(v => (v === '' || v === 'undefined' || v === 'null') ? null : v),
  body('players').optional(),
]);

export const highlightValidation = validate([
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('eventId').optional().isMongoId().withMessage('Invalid event ID'),
  body('mediaType').optional().isIn(MEDIA_TYPES),
]);

export const mongoIdParam = (paramName = 'id') =>
  validate([param(paramName).isMongoId().withMessage(`Invalid ${paramName}`)]);

export const eventQueryValidation = validate([
  query('sport').optional().customSanitizer(v => v ? v.toString().toLowerCase().trim() : v).isIn(SPORTS),
  query('status').optional().isIn(EVENT_STATUSES),
]);

export const registrationQueryValidation = validate([
  query('eventId').optional().isString(),
  query('paymentStatus').optional().isIn(['pending', 'verified', 'rejected']),
  query('registrationStatus').optional().isIn(['pending', 'approved', 'rejected']),
]);

export const rejectionReasonValidation = validate([
  body('reason').optional().isString(),
]);

export const forgotPasswordValidation = validate([
  body('email').trim().isEmail().withMessage('Valid email address is required'),
]);

export const resetPasswordValidation = validate([
  body('token').trim().notEmpty().withMessage('Password reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
]);
