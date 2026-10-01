import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  getPublicEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrationCount,
  getAllEventsAdmin,
  uploadEventRulebook,
  deleteEventRulebook,
  getLiveEventStatus,
} from '../services/event.service.js';

const parseEventBody = (body) => ({
  title: body.title,
  sport: body.sport,
  description: body.description,
  location: body.location,
  venue: body.venue,
  startDate: body.startDate,
  endDate: body.endDate,
  registrationStartDate: body.registrationStartDate,
  registrationEndDate: body.registrationEndDate,
  registrationFee: Number(body.registrationFee),
  maxTeams: Number(body.maxTeams),
  rules: body.rules || '',
  prizes: body.prizes,
  status: body.status,
});

export const listPublicEvents = asyncHandler(async (req, res) => {
  const events = await getPublicEvents(req.query);

  res.status(200).json(
    new ApiResponse(200, events, 'Events fetched successfully')
  );
});

export const getLiveStatusHandler = asyncHandler(async (_req, res) => {
  const data = await getLiveEventStatus();

  res.status(200).json(
    new ApiResponse(200, data, 'Live status fetched successfully')
  );
});

export const getSinglePublicEvent = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event fetched successfully')
  );
});

export const getEventRegistrationCount = asyncHandler(async (req, res) => {
  const data = await getRegistrationCount(req.params.eventId);

  res.status(200).json(
    new ApiResponse(200, data, 'Registration count fetched successfully')
  );
});

export const listAdminEvents = asyncHandler(async (req, res) => {
  const events = await getAllEventsAdmin(req.query);

  res.status(200).json(
    new ApiResponse(200, events, 'Events fetched successfully')
  );
});

export const getAdminEvent = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event fetched successfully')
  );
});

export const createEventHandler = asyncHandler(async (req, res) => {
  const event = await createEvent(
    parseEventBody(req.body),
    req.admin._id,
    req.file
  );

  res.status(201).json(
    new ApiResponse(201, event, 'Event created successfully')
  );
});

export const updateEventHandler = asyncHandler(async (req, res) => {
  const event = await updateEvent(
    req.params.id,
    parseEventBody(req.body),
    req.file
  );

  res.status(200).json(
    new ApiResponse(200, event, 'Event updated successfully')
  );
});

export const deleteEventHandler = asyncHandler(async (req, res) => {
  await deleteEvent(req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, 'Event deleted successfully')
  );
});

export const uploadRulebookHandler = asyncHandler(async (req, res) => {
  const event = await uploadEventRulebook(req.params.id, req.file);

  res.status(200).json(
    new ApiResponse(200, event, 'Rulebook PDF uploaded and updated successfully')
  );
});

export const deleteRulebookHandler = asyncHandler(async (req, res) => {
  const event = await deleteEventRulebook(req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Rulebook PDF removed successfully')
  );
});
