import mongoose from 'mongoose';
import { EVENT_STATUSES, SPORTS } from '../constants/index.js';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sport: {
      type: String,
      required: true,
      enum: SPORTS,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    registrationStartDate: {
      type: Date,
      required: true,
    },
    registrationEndDate: {
      type: Date,
      required: true,
    },
    registrationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    maxTeams: {
      type: Number,
      required: true,
      min: 1,
    },
    bannerImage: {
      type: String,
      default: null,
    },
    rules: {
      type: String,
      default: '',
    },
    rulebookPdf: {
      type: String,
      default: null,
    },
    rulebookFileName: {
      type: String,
      default: null,
    },
    rulebookUpdatedAt: {
      type: Date,
      default: null,
    },
    prizes: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'upcoming',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
