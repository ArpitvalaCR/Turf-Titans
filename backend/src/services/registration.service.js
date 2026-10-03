import mongoose from 'mongoose';
import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import TournamentGroup from '../models/group.model.js';
import Fixture from '../models/fixture.model.js';
import User from '../models/user.model.js';
import Admin from '../models/admin.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import {
  sendRegistrationSubmittedEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
} from './email.service.js';

const populateEvent = async (registration) => {
  if (!registration.eventId) return null;
  return Event.findById(registration.eventId);
};

export const createRegistration = async (data, paymentFile, currentUser = null) => {
  // 1. Identify User and enforce strict 3-team global limit
  const normalizedCaptainEmail = data.captainEmail ? data.captainEmail.trim().toLowerCase() : '';
  let user = currentUser || null;
  if (!user && data.userId) {
    user = await User.findById(data.userId);
  }
  if (!user && normalizedCaptainEmail) {
    user = await User.findOne({ email: normalizedCaptainEmail });
  }

  const normalizedUserEmail = user?.email ? user.email.trim().toLowerCase() : '';

  const userQueryConditions = [];
  if (user?._id) {
    userQueryConditions.push({ userId: user._id });
    data.userId = user._id;
  } else if (data.userId) {
    userQueryConditions.push({ userId: data.userId });
  }

  if (normalizedUserEmail) {
    userQueryConditions.push({ captainEmail: normalizedUserEmail });
  }
  if (normalizedCaptainEmail && normalizedCaptainEmail !== normalizedUserEmail) {
    userQueryConditions.push({ captainEmail: normalizedCaptainEmail });
  }

  if (userQueryConditions.length > 0) {
    const existingTeamCount = await Registration.countDocuments({
      $or: userQueryConditions,
    });

    if (existingTeamCount >= 3) {
      throw new ApiError(400, 'You can register a maximum of 3 teams.');
    }
  }

  if (data.eventId) {
    let event = null;
    if (mongoose.Types.ObjectId.isValid(data.eventId)) {
      event = await Event.findById(data.eventId);
    }
    if (!event) {
      event = await Event.findOne({
        $or: [
          { slug: data.eventId },
          { title: new RegExp(`^${data.eventId}$`, 'i') },
        ],
      });
    }
    if (!event) throw new ApiError(404, 'Event not found');
    data.eventId = event._id;

    if (event.status === 'registration_closed' || event.status === 'completed') {
      throw new ApiError(400, 'Registration is closed for this event');
    }

    const approvedCount = await Registration.countDocuments({
      eventId: event._id,
      registrationStatus: 'approved',
    });

    if (approvedCount >= event.maxTeams) {
      throw new ApiError(400, 'This event is full');
    }

    const duplicate = await Registration.findOne({
      eventId: data.eventId,
      teamName: new RegExp(`^${data.teamName.trim()}$`, 'i'),
    });

    if (duplicate) {
      throw new ApiError(409, 'This team is already registered for this event');
    }

    if (data.captainEmail) {
      const duplicateEmail = await Registration.findOne({
        eventId: data.eventId,
        captainEmail: normalizedCaptainEmail,
      });

      if (duplicateEmail) {
        throw new ApiError(409, 'This email is already registered for this tournament.');
      }
    }

    data.paymentAmount = typeof event.registrationFee === 'number' ? event.registrationFee : 1500;
  } else {
    data.paymentAmount = 1500;
    if (data.captainEmail) {
      const duplicateEmail = await Registration.findOne({
        eventId: null,
        captainEmail: normalizedCaptainEmail,
      });

      if (duplicateEmail) {
        throw new ApiError(409, 'This email is already registered for this tournament.');
      }
    }
  }

  // Security: Normal user submissions must ALWAYS start in pending state
  data.paymentStatus = 'pending';
  data.registrationStatus = 'pending';
  data.verifiedBy = null;
  data.verifiedAt = null;
  data.rejectionReason = '';

  if (paymentFile) {
    const result = await uploadToCloudinary(paymentFile.buffer, {
      folder: 'turf-titans/payments',
      resource_type: 'auto',
    });
    data.paymentProof = result.secure_url;
  } else if (data.paymentProof && typeof data.paymentProof === 'string' && data.paymentProof.startsWith('data:image/')) {
    try {
      const base64Data = data.paymentProof.split(';base64,').pop();
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const result = await uploadToCloudinary(fileBuffer, {
        folder: 'turf-titans/payments',
        resource_type: 'auto',
      });
      data.paymentProof = result.secure_url;
    } catch (uploadErr) {
      console.warn('Failed to parse base64 payment proof, storing raw format:', uploadErr.message);
    }
  }

  if (data.players?.length) {
    data.playerCount = data.players.length;
  }

  const registration = await Registration.create(data);
  const event = await populateEvent(registration);

  try {
    await sendRegistrationSubmittedEmail(registration, event);
  } catch (emailError) {
    console.error('Registration email failed:', emailError.message);
  }

  return registration;
};

export const getRegistrations = async (filters = {}) => {
  const query = {};

  if (filters.eventId) {
    let event = null;
    if (mongoose.Types.ObjectId.isValid(filters.eventId)) {
      event = await Event.findById(filters.eventId);
    }
    if (!event) {
      event = await Event.findOne({
        $or: [
          { slug: filters.eventId },
          { title: new RegExp(`^${filters.eventId}$`, 'i') },
        ],
      });
    }

    if (event) {
      const isDefault = event.slug === 'turf-titans-2025' || filters.eventId === 'turf-titans-2025';
      if (isDefault) {
        // If turf-titans-2025 default event, include both its eventId and null for backwards compatibility
        query.$or = [{ eventId: event._id }, { eventId: null }];
      } else {
        query.eventId = event._id;
      }
    } else if (mongoose.Types.ObjectId.isValid(filters.eventId)) {
      query.eventId = filters.eventId;
    } else {
      query.eventId = new mongoose.Types.ObjectId(); // Non-matching dummy ID
    }
  }

  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.registrationStatus) query.registrationStatus = filters.registrationStatus;

  return Registration.find(query)
    .sort({ createdAt: -1 })
    .populate('eventId', 'title sport venue startDate endDate')
    .populate('verifiedBy', 'username email');
};

export const deleteRegistration = async (registrationId) => {
  const registration = await Registration.findById(registrationId);
  if (!registration) throw new ApiError(404, 'Registration not found');

  // Also clean up this team from any TournamentGroup and UPCOMING fixtures
  if (registration.teamName) {
    const teamNameLower = registration.teamName.trim().toLowerCase();

    // Clean from Tournament Groups
    const groups = await TournamentGroup.find({});
    for (const g of groups) {
      const filtered = (g.teams || []).filter(
        (t) => t.trim().toLowerCase() !== teamNameLower
      );
      if (filtered.length !== (g.teams || []).length) {
        g.teams = filtered;
        await g.save();
      }
    }

    // Clean from UPCOMING fixtures
    await Fixture.deleteMany({
      status: 'UPCOMING',
      $or: [
        { team1: new RegExp(`^${registration.teamName.trim()}$`, 'i') },
        { team2: new RegExp(`^${registration.teamName.trim()}$`, 'i') },
      ],
    });
  }

  await Registration.findByIdAndDelete(registrationId);
  return { success: true };
};

export const getRegistrationById = async (registrationId) => {
  const registration = await Registration.findById(registrationId)
    .populate('eventId')
    .populate('verifiedBy', 'username email');

  if (!registration) throw new ApiError(404, 'Registration not found');
  return registration;
};

export const verifyPayment = async (registrationId, adminId) => {
  const registration = await getRegistrationById(registrationId);

  registration.paymentStatus = 'verified';
  registration.verifiedBy = adminId;
  registration.verifiedAt = new Date();
  await registration.save();

  const event = registration.eventId;

  try {
    await sendPaymentVerifiedEmail(registration, event);
  } catch (emailError) {
    console.error('Payment verified email failed:', emailError.message);
  }

  return registration;
};

export const rejectPayment = async (registrationId, adminId, reason = '') => {
  const registration = await getRegistrationById(registrationId);

  registration.paymentStatus = 'rejected';
  registration.rejectionReason = reason;
  registration.verifiedBy = adminId;
  registration.verifiedAt = new Date();
  await registration.save();

  const event = registration.eventId;

  try {
    await sendPaymentRejectedEmail(registration, event, reason);
  } catch (emailError) {
    console.error('Payment rejected email failed:', emailError.message);
  }

  return registration;
};

export const approveRegistration = async (registrationId, adminId) => {
  const registration = await getRegistrationById(registrationId);

  if (registration.eventId) {
    const event =
      typeof registration.eventId === 'object'
        ? registration.eventId
        : await Event.findById(registration.eventId);

    const approvedCount = await Registration.countDocuments({
      eventId: event._id,
      registrationStatus: 'approved',
    });

    if (approvedCount >= event.maxTeams) {
      throw new ApiError(400, 'Event has reached maximum team capacity');
    }
  }

  registration.registrationStatus = 'approved';
  registration.verifiedBy = adminId;
  registration.verifiedAt = new Date();

  if (registration.paymentStatus === 'pending' && registration.paymentProof) {
    registration.paymentStatus = 'verified';
  }

  await registration.save();

  const event = await populateEvent(registration);

  try {
    await sendRegistrationApprovedEmail(registration, event);
  } catch (emailError) {
    console.error('Registration approved email failed:', emailError.message);
  }

  return registration;
};

export const rejectRegistration = async (registrationId, adminId, reason = '') => {
  const registration = await getRegistrationById(registrationId);

  registration.registrationStatus = 'rejected';
  registration.rejectionReason = reason;
  registration.verifiedBy = adminId;
  registration.verifiedAt = new Date();
  await registration.save();

  const event = await populateEvent(registration);

  try {
    await sendRegistrationRejectedEmail(registration, event);
  } catch (emailError) {
    console.error('Registration rejected email failed:', emailError.message);
  }

  return registration;
};

export const getUserRegistrations = async (email, userId = null) => {
  if (!email && !userId) return [];
  const queryConditions = [];
  if (userId) queryConditions.push({ userId });
  if (email) queryConditions.push({ captainEmail: email.trim().toLowerCase() });
  const query = queryConditions.length === 1 ? queryConditions[0] : { $or: queryConditions };
  return Registration.find(query)
    .sort({ createdAt: -1 })
    .populate('eventId', 'title sport venue startDate endDate registrationFee status')
    .populate('verifiedBy', 'username email');
};

export const getRegistrationStatusByIdentifier = async (identifier, userEmail, isAdmin = false) => {
  if (!identifier) throw new ApiError(400, 'Registration identifier is required');
  const trimmed = identifier.trim();
  let query = { registrationId: trimmed };
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    query = { $or: [{ registrationId: trimmed }, { _id: trimmed }] };
  } else if (trimmed.includes('@')) {
    query = { captainEmail: trimmed.toLowerCase() };
  }
  const registration = await Registration.findOne(query)
    .sort({ createdAt: -1 })
    .populate('eventId', 'title sport venue startDate endDate registrationFee status');
  if (!registration) throw new ApiError(404, 'Registration not found');

  // Security: User can only access their own registration unless they are an admin
  if (!isAdmin && userEmail && registration.captainEmail.toLowerCase() !== userEmail.toLowerCase()) {
    throw new ApiError(403, 'Forbidden: You are not authorized to view this registration');
  }

  return registration;
};
