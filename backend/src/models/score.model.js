import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tournamentId: {
      type: String,
      required: true,
      default: 'turf-titans-2025',
    },
    battingTeam: {
      type: String,
      default: 'Team 1',
    },
    bowlingTeam: {
      type: String,
      default: 'Team 2',
    },
    runs: {
      type: Number,
      default: 0,
    },
    wickets: {
      type: Number,
      default: 0,
    },
    balls: {
      type: Number,
      default: 0,
    },
    maxOvers: {
      type: Number,
      default: 5.0,
    },
    target: {
      type: Number,
      default: 0,
    },
    telemetry: {
      type: [String],
      default: [],
    },
    striker: {
      name: { type: String, default: 'Striker 1' },
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
    },
    nonStriker: {
      name: { type: String, default: 'Striker 2' },
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
    },
    bowler: {
      name: { type: String, default: 'Bowler' },
      overs: { type: String, default: '0.0' },
      runsConceded: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['live', 'completed', 'upcoming', 'stopped', 'STOPPED', 'LIVE', 'COMPLETED', 'UPCOMING'],
      default: 'live',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Score = mongoose.model('Score', scoreSchema);

export { Score };
export default Score;
