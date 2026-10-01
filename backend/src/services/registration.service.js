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

export const createRegistration = async (data, paymentFile) => {
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
      const normalizedEmail = data.captainEmail.trim().toLowerCase();
      const duplicateEmail = await Registration.findOne({
        eventId: data.eventId,
        captainEmail: normalizedEmail,
      });

      if (duplicateEmail) {
        throw new ApiError(409, 'This email is already registered for this tournament.');
      }
    }

    if (!data.paymentAmount) {
      data.paymentAmount = event.registrationFee;
    }
  } else if (data.captainEmail) {
    const normalizedEmail = data.captainEmail.trim().toLowerCase();
    const duplicateEmail = await Registration.findOne({
      eventId: null,
      captainEmail: normalizedEmail,
    });

    if (duplicateEmail) {
      throw new ApiError(409, 'This email is already registered for this tournament.');
    }
  }

  if (paymentFile) {
    const result = await uploadToCloudinary(paymentFile.buffer, {
      folder: 'turf-titans/payments',
      resource_type: 'auto',
    });
    data.paymentProof = result.secure_url;
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
