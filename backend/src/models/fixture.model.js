import mongoose from 'mongoose';

const fixtureSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      default: 'turf-titans-2025',
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    matchNumber: {
      type: Number,
    },
    team1: {
      type: String,
      required: true,
      trim: true,
    },
    team2: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    ground: {
      type: String,
      required: true,
      trim: true,
      default: 'Pitch 1 - North Court',
    },
    matchTitle: {
      type: String,
      default: 'Group Stage Match',
      trim: true,
    },
    round: {
      type: String,
      default: 'Group Stage',
      trim: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'STOPPED', 'upcoming', 'live', 'completed', 'stopped'],
      default: 'UPCOMING',
    },
    score: {
      team1Runs: { type: Number, default: 0 },
      team1Wickets: { type: Number, default: 0 },
      team1Overs: { type: String, default: '0.0' },
      team2Runs: { type: Number, default: 0 },
      team2Wickets: { type: Number, default: 0 },
      team2Overs: { type: String, default: '0.0' },
    },
    result: {
      type: String,
      default: '',
    },
    stoppedReason: {
      type: String,
      default: '',
      trim: true,
    },
    stoppedReasonDescription: {
      type: String,
      default: '',
      trim: true,
    },
    matchId: {
      type: String,
      default: function () {
        return `match-${this.tournamentId || 'turf'}-${Date.now().toString().slice(-6)}`;
      },
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

fixtureSchema.index({ tournamentId: 1, groupName: 1 });

const Fixture = mongoose.model('Fixture', fixtureSchema);

export { Fixture };
export default Fixture;
