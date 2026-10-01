import Highlight from '../models/highlight.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const getPublicHighlights = async (filters = {}) => {
  const query = {};
  if (filters.eventId) query.eventId = filters.eventId;
  if (filters.mediaType) query.mediaType = filters.mediaType;

  return Highlight.find(query)
    .sort({ createdAt: -1 })
    .populate('eventId', 'title sport')
    .populate('createdBy', 'username');
};

export const getHighlightById = async (highlightId) => {
  const highlight = await Highlight.findById(highlightId)
    .populate('eventId', 'title sport')
    .populate('createdBy', 'username email');

  if (!highlight) throw new ApiError(404, 'Highlight not found');
  return highlight;
};

export const createHighlight = async (data, adminId, mediaFile) => {
  if (!mediaFile) {
    throw new ApiError(400, 'Media file is required');
  }

  const isVideo = mediaFile.mimetype.startsWith('video/');
  const result = await uploadToCloudinary(mediaFile.buffer, {
    folder: 'turf-titans/highlights',
    resource_type: isVideo ? 'video' : 'image',
  });

  return Highlight.create({
    title: data.title,
    description: data.description || '',
    eventId: data.eventId || null,
    mediaType: isVideo ? 'video' : 'image',
    mediaUrl: result.secure_url,
    thumbnail: isVideo ? result.thumbnail_url || null : result.secure_url,
    createdBy: adminId,
  });
};

export const updateHighlight = async (highlightId, data, mediaFile) => {
  const highlight = await getHighlightById(highlightId);
  const updates = {
    title: data.title ?? highlight.title,
    description: data.description ?? highlight.description,
    eventId: data.eventId ?? highlight.eventId,
  };

  if (mediaFile) {
    const isVideo = mediaFile.mimetype.startsWith('video/');
    const result = await uploadToCloudinary(mediaFile.buffer, {
      folder: 'turf-titans/highlights',
      resource_type: isVideo ? 'video' : 'image',
    });

    updates.mediaType = isVideo ? 'video' : 'image';
    updates.mediaUrl = result.secure_url;
    updates.thumbnail = isVideo ? result.thumbnail_url || null : result.secure_url;
  }

  Object.assign(highlight, updates);
  await highlight.save();
  return highlight;
};

export const deleteHighlight = async (highlightId) => {
  const highlight = await getHighlightById(highlightId);
  await highlight.deleteOne();
  return highlight;
};

export const getAllHighlightsAdmin = async (filters = {}) => {
  const query = {};
  if (filters.eventId) query.eventId = filters.eventId;
  if (filters.mediaType) query.mediaType = filters.mediaType;

  return Highlight.find(query)
    .sort({ createdAt: -1 })
    .populate('eventId', 'title sport')
    .populate('createdBy', 'username email');
};
