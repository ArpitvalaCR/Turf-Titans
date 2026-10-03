import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  verifyPayment,
  rejectPayment,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  getUserRegistrations,
  getRegistrationStatusByIdentifier,
} from '../services/registration.service.js';

const parseRegistrationBody = (body) => ({
  registrationId: body.registrationId || `TT-REG-${Math.floor(1000 + Math.random() * 9000)}`,
  eventId: body.eventId || null,
  userId: body.userId || null,
  teamName: body.teamName,
  teamLogo: body.teamLogo || null,
  captainName: body.captainName,
  captainEmail: body.captainEmail,
  captainPhone: body.captainPhone || '',
  whatsappNumber: body.whatsappNumber || '',
  department: body.department || '',
  sport: body.sport || '',
  message: body.message || '',
  paymentProof: body.paymentProof || body.paymentScreenshot || null,
  transactionId: body.transactionId || '',
  players:
    typeof body.players === 'string'
      ? JSON.parse(body.players)
      : body.players || [],
});

export const submitRegistration = asyncHandler(async (req, res) => {
  const body = parseRegistrationBody(req.body);
  if (req.user?._id) {
    body.userId = req.user._id;
  }
  const registration = await createRegistration(
    body,
    req.file,
    req.user
  );

  res.status(201).json(
    new ApiResponse(201, registration, 'Registration submitted successfully')
  );
});

export const listRegistrations = asyncHandler(async (req, res) => {
  const registrations = await getRegistrations(req.query);

  res.status(200).json(
    new ApiResponse(200, registrations, 'Registrations fetched successfully')
  );
});

export const getSingleRegistration = asyncHandler(async (req, res) => {
  const registration = await getRegistrationById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, registration, 'Registration fetched successfully')
  );
});

export const verifyPaymentHandler = asyncHandler(async (req, res) => {
  const registration = await verifyPayment(req.params.id, req.admin._id);

  res.status(200).json(
    new ApiResponse(200, registration, 'Payment verified successfully')
  );
});

export const rejectPaymentHandler = asyncHandler(async (req, res) => {
  const registration = await rejectPayment(
    req.params.id,
    req.admin._id,
    req.body.reason
  );

  res.status(200).json(
    new ApiResponse(200, registration, 'Payment rejected successfully')
  );
});

export const approveRegistrationHandler = asyncHandler(async (req, res) => {
  const registration = await approveRegistration(req.params.id, req.admin._id);

  res.status(200).json(
    new ApiResponse(200, registration, 'Registration approved successfully')
  );
});

export const rejectRegistrationHandler = asyncHandler(async (req, res) => {
  const registration = await rejectRegistration(
    req.params.id,
    req.admin._id,
    req.body.reason
  );

  res.status(200).json(
    new ApiResponse(200, registration, 'Registration rejected successfully')
  );
});

export const deleteRegistrationHandler = asyncHandler(async (req, res) => {
  await deleteRegistration(req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, 'Registration deleted successfully')
  );
});

export const getMyRegistrationsHandler = asyncHandler(async (req, res) => {
  const email = req.user?.email;
  if (!email && !req.user?._id) {
    throw new ApiError(401, 'Unauthorized: User not authenticated');
  }
  const registrations = await getUserRegistrations(email, req.user?._id);
  res.status(200).json(
    new ApiResponse(200, registrations, 'User registrations fetched successfully')
  );
});

export const getRegistrationStatusHandler = asyncHandler(async (req, res) => {
  const identifier = req.params.identifier;
  const userEmail = req.user?.email;
  if (!userEmail) {
    throw new ApiError(401, 'Unauthorized: User not authenticated');
  }
  const isAdmin = req.user?.role === 'admin' || Boolean(req.admin);
  const registration = await getRegistrationStatusByIdentifier(identifier, userEmail, isAdmin);
  res.status(200).json(
    new ApiResponse(200, registration, 'Registration status fetched successfully')
  );
});
