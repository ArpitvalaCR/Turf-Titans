import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
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
    teams: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

groupSchema.index({ tournamentId: 1, groupName: 1 }, { unique: true });

const TournamentGroup = mongoose.model('TournamentGroup', groupSchema);

export { TournamentGroup };
export default TournamentGroup;
