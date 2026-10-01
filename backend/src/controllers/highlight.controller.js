import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  getPublicHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getAllHighlightsAdmin,
} from '../services/highlight.service.js';

export const listPublicHighlights = asyncHandler(async (req, res) => {
  const highlights = await getPublicHighlights(req.query);

  res.status(200).json(
    new ApiResponse(200, highlights, 'Highlights fetched successfully')
  );
});

export const getSingleHighlight = asyncHandler(async (req, res) => {
  const highlight = await getHighlightById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, highlight, 'Highlight fetched successfully')
  );
});

export const listAdminHighlights = asyncHandler(async (req, res) => {
  const highlights = await getAllHighlightsAdmin(req.query);

  res.status(200).json(
    new ApiResponse(200, highlights, 'Highlights fetched successfully')
  );
});

export const createHighlightHandler = asyncHandler(async (req, res) => {
  const highlight = await createHighlight(req.body, req.admin._id, req.file);

  res.status(201).json(
    new ApiResponse(201, highlight, 'Highlight created successfully')
  );
});

export const updateHighlightHandler = asyncHandler(async (req, res) => {
  const highlight = await updateHighlight(req.params.id, req.body, req.file);

  res.status(200).json(
    new ApiResponse(200, highlight, 'Highlight updated successfully')
  );
});

export const deleteHighlightHandler = asyncHandler(async (req, res) => {
  await deleteHighlight(req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, 'Highlight deleted successfully')
  );
});
