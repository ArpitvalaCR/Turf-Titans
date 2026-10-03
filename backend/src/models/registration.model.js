import mongoose from 'mongoose';
import {
  PAYMENT_STATUSES,
  REGISTRATION_STATUSES,
  SPORTS,
} from '../constants/index.js';

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    jerseyNumber: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: 'Player' },
    isSubstitute: { type: Boolean, default: false },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamLogo: {
      type: String,
      default: null,
    },
    captainName: {
      type: String,
      required: true,
      trim: true,
    },
    captainEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    captainPhone: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    sport: {
      type: String,
      enum: [...SPORTS, ''],
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    players: {
      type: [playerSchema],
      default: [],
    },
    playerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentProof: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: 'pending',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

registrationSchema.virtual('paymentScreenshot').get(function () {
  return this.paymentProof;
});

registrationSchema.index(
  { eventId: 1, teamName: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $type: 'objectId' } },
  }
);

registrationSchema.index(
  { eventId: 1, captainEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $type: 'objectId' } },
  }
);

const Registration = mongoose.model('Registration', registrationSchema);

export { Registration };
export default Registration;
