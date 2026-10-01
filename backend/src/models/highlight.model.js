import mongoose from 'mongoose';
import { MEDIA_TYPES } from '../constants/index.js';

const highlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
      default: null,
    },
    mediaType: {
      type: String,
      enum: MEDIA_TYPES,
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

const Highlight = mongoose.model('Highlight', highlightSchema);

export default Highlight;
