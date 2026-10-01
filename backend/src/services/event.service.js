import mongoose from 'mongoose';
import Event from '../models/event.model.js';
import Registration from '../models/registration.model.js';
import TournamentGroup from '../models/group.model.js';
import Fixture from '../models/fixture.model.js';
import MatchSession from '../models/matchSession.model.js';
import Score from '../models/score.model.js';
import Highlight from '../models/highlight.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const getPublicEvents = async (filters = {}) => {
  const query = {};

  if (filters.sport) {
    query.sport = { $regex: new RegExp(`^${filters.sport.trim()}$`, 'i') };
  }
  if (filters.status) query.status = filters.status;

  return Event.find(query).sort({ startDate: 1 }).populate('createdBy', 'username email');
};

export const getEventById = async (eventId) => {
  let event = null;
  if (mongoose.Types.ObjectId.isValid(eventId)) {
    event = await Event.findById(eventId).populate('createdBy', 'username email');
  }
  if (!event) {
    event = await Event.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(eventId) ? eventId : null }, { title: { $regex: new RegExp(`^${eventId}$`, 'i') } }]
    }).populate('createdBy', 'username email');
  }
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const createEvent = async (data, adminId, bannerFile) => {
  let bannerImage = null;

  if (bannerFile) {
    const result = await uploadToCloudinary(bannerFile.buffer, {
      folder: 'turf-titans/events',
      resource_type: 'image',
    });
    bannerImage = result.secure_url;
  }

  return Event.create({
    ...data,
    bannerImage,
    createdBy: adminId,
  });
};

export const updateEvent = async (eventId, data, bannerFile) => {
  const event = await getEventById(eventId);
  const updates = { ...data };

  if (bannerFile) {
    const result = await uploadToCloudinary(bannerFile.buffer, {
      folder: 'turf-titans/events',
      resource_type: 'image',
    });
    updates.bannerImage = result.secure_url;
  }

  Object.assign(event, updates);
  await event.save();
  return event;
};

export const deleteEvent = async (eventId) => {
  const event = await getEventById(eventId);
  const idString = event._id.toString();

  // Cascade cleanup for all records associated with this tournament / event
  await Promise.all([
    Registration.deleteMany({
      $or: [{ eventId: event._id }, { eventId: idString }]
    }),
    TournamentGroup.deleteMany({
      $or: [{ tournamentId: idString }, { tournamentId: event._id }]
    }),
    Fixture.deleteMany({
      $or: [{ tournamentId: idString }, { tournamentId: event._id }]
    }),
    MatchSession.deleteMany({
      $or: [{ eventId: event._id }, { eventId: idString }, { tournamentId: idString }]
    }),
    Score.deleteMany({
      $or: [{ tournamentId: idString }, { tournamentId: event._id }]
    }),
    Highlight.deleteMany({
      $or: [{ eventId: event._id }, { eventId: idString }]
    }),
  ]);

  await event.deleteOne();
  return event;
};

export const getRegistrationCount = async (eventId) => {
  const event = await getEventById(eventId);

  const registeredTeams = await Registration.countDocuments({
    $or: [{ eventId: event._id }, { eventId: event._id.toString() }],
    registrationStatus: 'approved',
  });

  return {
    registeredTeams,
    maxTeams: event.maxTeams,
    totalSubmitted: await Registration.countDocuments({
      $or: [{ eventId: event._id }, { eventId: event._id.toString() }]
    }),
  };
};

export const getAllEventsAdmin = async (filters = {}) => {
  const query = {};
  if (filters.sport) {
    query.sport = { $regex: new RegExp(`^${filters.sport.trim()}$`, 'i') };
  }
  if (filters.status) query.status = filters.status;

  return Event.find(query).sort({ createdAt: -1 }).populate('createdBy', 'username email');
};

export const uploadEventRulebook = async (eventId, rulebookFile) => {
  if (!rulebookFile) {
    throw new ApiError(400, 'Rulebook PDF file is required');
  }

  if (rulebookFile.mimetype !== 'application/pdf') {
    throw new ApiError(400, 'Invalid file format. Only PDF files are allowed.');
  }

  const event = await getEventById(eventId);

  const uploadResult = await uploadToCloudinary(rulebookFile.buffer, {
    folder: 'turf-titans/rulebooks',
    resource_type: 'raw',
    format: 'pdf',
  });

  event.rulebookPdf = uploadResult.secure_url;
  event.rulebookFileName = rulebookFile.originalname || 'Official_Rulebook.pdf';
  event.rulebookUpdatedAt = new Date();
  await event.save();

  return event;
};

export const deleteEventRulebook = async (eventId) => {
  const event = await getEventById(eventId);
  event.rulebookPdf = null;
  event.rulebookFileName = null;
  event.rulebookUpdatedAt = null;
  await event.save();
  return event;
};

export const getLiveEventStatus = async () => {
  const now = new Date();

  // 1. Check live fixtures
  const liveFixture = await Fixture.findOne({
    status: { $in: ['LIVE', 'live', 'IN_PROGRESS', 'in_progress'] },
  });

  // 2. Check active match sessions
  const liveMatchSession = await MatchSession.findOne({
    status: { $in: ['IN_PROGRESS', 'LIVE'] },
  });

  // 3. Check active events by date and status
  const liveEvent = await Event.findOne({
    $or: [
      { status: 'live' },
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: { $nin: ['completed', 'cancelled', 'upcoming'] },
      },
    ],
  });

  const isLive = Boolean(liveFixture || liveMatchSession || liveEvent);
  const activeEventId =
    liveEvent?._id?.toString() ||
    liveFixture?.tournamentId ||
    liveMatchSession?.tournamentId ||
    liveMatchSession?.eventId?.toString() ||
    null;

  const activeMatchId =
    liveMatchSession?.matchId ||
    liveFixture?.matchId ||
    (liveFixture ? `match-${liveFixture._id}` : null);

  return {
    isLive,
    activeEventId,
    activeMatchId,
    liveFixture: liveFixture
      ? {
          _id: liveFixture._id,
          team1: liveFixture.team1,
          team2: liveFixture.team2,
          tournamentId: liveFixture.tournamentId,
        }
      : null,
    liveEvent: liveEvent
      ? {
          _id: liveEvent._id,
          title: liveEvent.title,
          sport: liveEvent.sport,
        }
      : null,
  };
};
