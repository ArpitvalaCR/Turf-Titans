import mongoose from 'mongoose';

const playerInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    jerseyNumber: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: 'Player' },
  },
  { _id: false }
);

const dismissalSchema = new mongoose.Schema(
  {
    batsmanOut: { type: String, required: true, trim: true },
    dismissalType: {
      type: String,
      required: true,
      enum: [
        'BOWLED',
        'CAUGHT',
        'CAUGHT_BEHIND',
        'RUN_OUT',
        'STUMPED',
        'RETIRED_HURT',
        'HIT_WICKET',
        'LBW',
      ],
    },
    bowlerCredited: { type: Boolean, default: true },
    bowler: { type: String, trim: true },
    fielderCatcher: { type: String, trim: true, default: '' },
    wicketKeeper: { type: String, trim: true, default: '' },
    runOutDetails: {
      thrower: { type: String, trim: true, default: '' },
      isDirectHit: { type: Boolean, default: true },
      assistingFielder: { type: String, trim: true, default: '' },
    },
    newBatsman: { type: String, trim: true, default: '' },
    newBatsmanStrike: {
      type: String,
      enum: ['STRIKER', 'NON_STRIKER'],
      default: 'STRIKER',
    },
  },
  { _id: false }
);

const ballEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    inningsNumber: { type: Number, required: true, enum: [1, 2] },
    overNumber: { type: Number, required: true },
    ballInOver: { type: Number, required: true },
    isLegalDelivery: { type: Boolean, default: true },
    bowler: { type: String, required: true, trim: true },
    striker: { type: String, required: true, trim: true },
    nonStriker: { type: String, required: true, trim: true },
    runsScoredOffBat: { type: Number, default: 0 },
    extras: {
      type: {
        type: String,
        enum: ['NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'],
        default: 'NONE',
      },
      extraRuns: { type: Number, default: 0 },
      additionalRanRuns: { type: Number, default: 0 },
    },
    totalRunsOnDelivery: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    dismissal: { type: dismissalSchema, default: null },
    stateSnapshot: {
      scoreBefore: {
        runs: Number,
        wickets: Number,
        legalBalls: Number,
      },
      scoreAfter: {
        runs: Number,
        wickets: Number,
        legalBalls: Number,
      },
      strikerAfter: String,
      nonStrikerAfter: String,
      bowlerAfter: String,
      didStrikeChange: Boolean,
      didOverEnd: Boolean,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const batsmanScoreSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    isOut: { type: Boolean, default: false },
    dismissal: { type: dismissalSchema, default: null },
    battingOrder: { type: Number, default: 1 },
  },
  { _id: false }
);

const bowlerScoreSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    oversBowled: { type: String, default: '0.0' },
    ballsBowled: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    dotBalls: { type: Number, default: 0 },
  },
  { _id: false }
);

const fallOfWicketSchema = new mongoose.Schema(
  {
    wicketNumber: { type: Number, required: true },
    score: { type: Number, required: true },
    over: { type: String, required: true },
    batsmanOut: { type: String, required: true },
  },
  { _id: false }
);

const inningsSchema = new mongoose.Schema(
  {
    inningsNumber: { type: Number, required: true, enum: [1, 2] },
    battingTeam: { type: String, required: true, trim: true },
    bowlingTeam: { type: String, required: true, trim: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalLegalBalls: { type: Number, default: 0 },
    oversFormatted: { type: String, default: '0.0' },
    extras: {
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      byes: { type: Number, default: 0 },
      legByes: { type: Number, default: 0 },
      penalty: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    battingScorecard: { type: [batsmanScoreSchema], default: [] },
    bowlingScorecard: { type: [bowlerScoreSchema], default: [] },
    fallOfWickets: { type: [fallOfWicketSchema], default: [] },
    events: { type: [ballEventSchema], default: [] },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'STOPPED', 'ABANDONED'],
      default: 'NOT_STARTED',
    },
  },
  { _id: false }
);

const matchSessionSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fixtureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fixture',
      required: true,
      index: true,
    },
    tournamentId: {
      type: String,
      required: true,
      index: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    config: {
      totalOvers: { type: Number, default: 5 },
      playersPerSide: { type: Number, default: 7 },
      maxOversPerBowler: { type: Number, default: 1 },
      isBowlingLimitStrict: { type: Boolean, default: true },
    },
    team1Squad: {
      teamName: { type: String, required: true, trim: true },
      playing: { type: [playerInfoSchema], default: [] },
      substitutes: { type: [playerInfoSchema], default: [] },
      wicketKeeper: { type: String, trim: true, default: '' },
    },
    team2Squad: {
      teamName: { type: String, required: true, trim: true },
      playing: { type: [playerInfoSchema], default: [] },
      substitutes: { type: [playerInfoSchema], default: [] },
      wicketKeeper: { type: String, trim: true, default: '' },
    },
    toss: {
      wonBy: { type: String, trim: true, default: '' },
      electedTo: { type: String, enum: ['BAT', 'BOWL', ''], default: '' },
      battingFirst: { type: String, trim: true, default: '' },
      bowlingFirst: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['SETUP', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'STOPPED', 'ABANDONED'],
      default: 'SETUP',
      index: true,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
    stoppedReason: {
      type: String,
      default: '',
    },
    stoppedDetails: {
      type: String,
      default: '',
    },
    currentInnings: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    target: {
      type: Number,
      default: 0,
    },
    liveState: {
      battingTeam: { type: String, default: '' },
      bowlingTeam: { type: String, default: '' },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      legalBalls: { type: Number, default: 0 },
      oversDisplay: { type: String, default: '0.0' },
      striker: { type: String, default: '' },
      nonStriker: { type: String, default: '' },
      currentBowler: { type: String, default: '' },
      bowlerOverDeliveries: { type: Number, default: 0 },
      inningsStatus: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'STOPPED'],
        default: 'NOT_STARTED',
      },
      recentBalls: { type: [String], default: [] },
    },
    innings: {
      type: [inningsSchema],
      default: [],
    },
    lock: {
      activeAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
      },
      activeAdminName: { type: String, default: null },
      sessionId: { type: String, default: null },
      acquiredAt: { type: Date, default: null },
      lastHeartbeat: { type: Date, default: null },
    },
    substitutions: [
      {
        inningsNumber: { type: Number, enum: [1, 2] },
        over: Number,
        ball: Number,
        teamName: String,
        playerOut: String,
        playerIn: String,
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    result: {
      winnerTeam: { type: String, default: '' },
      isTie: { type: Boolean, default: false },
      margin: { type: String, default: '' },
      playerOfTheMatch: { type: String, default: '' },
      completedAt: { type: Date, default: null },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

matchSessionSchema.index({ tournamentId: 1, status: 1 });

const MatchSession = mongoose.model('MatchSession', matchSessionSchema);

export { MatchSession };
export default MatchSession;
