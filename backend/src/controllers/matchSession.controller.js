import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import MatchSession from '../models/matchSession.model.js';
import Fixture from '../models/fixture.model.js';
import Registration from '../models/registration.model.js';
import { ballsToOversStr, oversToBalls } from '../services/pointsTable.service.js';
import crypto from 'crypto';

const LOCK_TIMEOUT_MS = 60 * 1000; // 60 seconds heartbeat expiration

/**
 * Helper to check and validate lock on a match session for admin operations
 */
function verifySessionLock(session, userId, clientSessionId) {
  if (!session.lock || !session.lock.activeAdminId) {
    return true; // No active lock
  }

  const isExpired =
    !session.lock.lastHeartbeat ||
    Date.now() - new Date(session.lock.lastHeartbeat).getTime() > LOCK_TIMEOUT_MS;

  if (isExpired) {
    return true; // Lock has expired, caller can override/claim
  }

  const isSameAdmin =
    userId && session.lock.activeAdminId.toString() === userId.toString();

  if (isSameAdmin) {
    return true;
  }

  throw new ApiError(
    423,
    `Match is currently locked by admin "${session.lock.activeAdminName || 'Another Administrator'}". You have read-only access.`
  );
}

/**
 * Uniformly formats match session data with isConfigured and lock flags
 */
function formatSessionResponse(session, userId) {
  if (!session) return null;
  const isLockExpired =
    !session.lock?.lastHeartbeat ||
    Date.now() - new Date(session.lock.lastHeartbeat).getTime() > LOCK_TIMEOUT_MS;

  const isSameAdmin =
    userId && session.lock?.activeAdminId &&
    session.lock.activeAdminId.toString() === userId.toString();

  const isLockedByOther =
    session.lock?.activeAdminId &&
    !isLockExpired &&
    !isSameAdmin;

  const isLockHeldByMe =
    isSameAdmin || (!session.lock?.activeAdminId);

  const raw = typeof session.toObject === 'function' ? session.toObject() : session;

  return {
    ...raw,
    isConfigured: true,
    isLockedByOther: Boolean(isLockedByOther),
    isLockHeldByMe: Boolean(isLockHeldByMe),
    lockedByAdminName: isLockedByOther ? session.lock?.activeAdminName : null,
  };
}

/**
 * 1. Initialize & Setup Match before scoring begins
 */
export const setupMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const {
    config,
    team1Squad,
    team2Squad,
    toss,
    openers, // { striker, nonStriker, openingBowler }
    sessionId,
  } = req.body;

  const fixture = await Fixture.findOne(
    mongoose.Types.ObjectId.isValid(matchId)
      ? { $or: [{ matchId }, { _id: matchId }] }
      : { matchId }
  );
  if (!fixture) {
    throw new ApiError(404, 'Fixture not found for this match');
  }

  // Validate Toss
  if (!toss || !toss.wonBy || !toss.electedTo) {
    throw new ApiError(400, 'Toss winner and election (BAT/BOWL) are required');
  }

  const team1Name = fixture.team1.trim();
  const team2Name = fixture.team2.trim();

  let battingFirst = '';
  let bowlingFirst = '';

  if (toss.wonBy.trim().toLowerCase() === team1Name.toLowerCase()) {
    battingFirst = toss.electedTo === 'BAT' ? team1Name : team2Name;
    bowlingFirst = toss.electedTo === 'BAT' ? team2Name : team1Name;
  } else if (toss.wonBy.trim().toLowerCase() === team2Name.toLowerCase()) {
    battingFirst = toss.electedTo === 'BAT' ? team2Name : team1Name;
    bowlingFirst = toss.electedTo === 'BAT' ? team1Name : team2Name;
  } else {
    throw new ApiError(400, `Toss winner "${toss.wonBy}" is not one of the match teams`);
  }

  // Validate Squads
  if (!team1Squad || !team1Squad.playing || team1Squad.playing.length < 2) {
    throw new ApiError(400, `${team1Name} playing squad must have at least 2 players`);
  }
  if (!team2Squad || !team2Squad.playing || team2Squad.playing.length < 2) {
    throw new ApiError(400, `${team2Name} playing squad must have at least 2 players`);
  }

  // Validate Openers
  if (!openers || !openers.striker || !openers.nonStriker || !openers.openingBowler) {
    throw new ApiError(400, 'Striker, Non-striker, and Opening Bowler are required');
  }

  const strikerName = openers.striker.trim();
  const nonStrikerName = openers.nonStriker.trim();
  const bowlerName = openers.openingBowler.trim();

  if (strikerName.toLowerCase() === nonStrikerName.toLowerCase()) {
    throw new ApiError(400, 'Striker and Non-striker cannot be the same player');
  }

  const battingSquad = battingFirst.toLowerCase() === team1Name.toLowerCase() ? team1Squad : team2Squad;
  const bowlingSquad = bowlingFirst.toLowerCase() === team1Name.toLowerCase() ? team1Squad : team2Squad;

  const battingPlayingNames = battingSquad.playing.map((p) => p.name.trim().toLowerCase());
  const bowlingPlayingNames = bowlingSquad.playing.map((p) => p.name.trim().toLowerCase());

  if (!battingPlayingNames.includes(strikerName.toLowerCase())) {
    throw new ApiError(400, `Striker "${strikerName}" is not in ${battingFirst}'s playing squad`);
  }
  if (!battingPlayingNames.includes(nonStrikerName.toLowerCase())) {
    throw new ApiError(400, `Non-striker "${nonStrikerName}" is not in ${battingFirst}'s playing squad`);
  }
  if (!bowlingPlayingNames.includes(bowlerName.toLowerCase())) {
    throw new ApiError(400, `Bowler "${bowlerName}" is not in ${bowlingFirst}'s playing squad`);
  }

  const totalOvers = Number(config?.totalOvers || 5);
  const playersPerSide = Number(config?.playersPerSide || 7);
  const maxOversPerBowler = Number(config?.maxOversPerBowler || Math.ceil(totalOvers / 4));
  const isBowlingLimitStrict = config?.isBowlingLimitStrict !== false;

  // Initialize Innings 1
  const innings1 = {
    inningsNumber: 1,
    battingTeam: battingFirst,
    bowlingTeam: bowlingFirst,
    totalRuns: 0,
    totalWickets: 0,
    totalLegalBalls: 0,
    oversFormatted: '0.0',
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
    battingScorecard: [
      { playerName: strikerName, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
      { playerName: nonStrikerName, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
    ],
    bowlingScorecard: [
      { playerName: bowlerName, oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
    ],
    fallOfWickets: [],
    events: [],
    status: 'IN_PROGRESS',
  };

  const activeSessionId = sessionId || crypto.randomUUID();

  // Upsert MatchSession
  const session = await MatchSession.findOneAndUpdate(
    { matchId },
    {
      matchId,
      fixtureId: fixture._id,
      tournamentId: fixture.tournamentId,
      groupName: fixture.groupName,
      config: {
        totalOvers,
        playersPerSide,
        maxOversPerBowler,
        isBowlingLimitStrict,
      },
      team1Squad: {
        teamName: team1Name,
        playing: team1Squad.playing,
        substitutes: team1Squad.substitutes || [],
        wicketKeeper: team1Squad.wicketKeeper || '',
      },
      team2Squad: {
        teamName: team2Name,
        playing: team2Squad.playing,
        substitutes: team2Squad.substitutes || [],
        wicketKeeper: team2Squad.wicketKeeper || '',
      },
      toss: {
        wonBy: toss.wonBy.trim(),
        electedTo: toss.electedTo,
        battingFirst,
        bowlingFirst,
      },
      status: 'LIVE',
      currentInnings: 1,
      target: 0,
      liveState: {
        battingTeam: battingFirst,
        bowlingTeam: bowlingFirst,
        runs: 0,
        wickets: 0,
        legalBalls: 0,
        oversDisplay: '0.0',
        striker: strikerName,
        nonStriker: nonStrikerName,
        currentBowler: bowlerName,
        bowlerOverDeliveries: 0,
        inningsStatus: 'IN_PROGRESS',
        recentBalls: [],
      },
      innings: [innings1],
      lock: {
        activeAdminId: req.user._id,
        activeAdminName: req.user.name || req.user.username || 'Admin',
        sessionId: activeSessionId,
        acquiredAt: new Date(),
        lastHeartbeat: new Date(),
      },
      createdBy: req.user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Update Fixture status
  await Fixture.findByIdAndUpdate(fixture._id, {
    status: 'LIVE',
    score: {
      team1Runs: 0,
      team1Wickets: 0,
      team1Overs: '0.0',
      team2Runs: 0,
      team2Wickets: 0,
      team2Overs: '0.0',
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { session: formatSessionResponse(session, req.user?._id), sessionId: activeSessionId },
      'Match setup completed & started successfully'
    )
  );
});

/**
 * 2. Get Match Session & Live Scorecard (Public & Realtime view)
 */
export const getMatchSession = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.query.sessionId;

  let session = await MatchSession.findOne({ matchId });
  if (!session && mongoose.Types.ObjectId.isValid(matchId)) {
    session = await MatchSession.findOne({ fixtureId: matchId });
  }

  // If session doesn't exist yet, return lightweight metadata from Fixture
  if (!session) {
    const fixture = await Fixture.findOne(
      mongoose.Types.ObjectId.isValid(matchId)
        ? { $or: [{ matchId }, { _id: matchId }] }
        : { matchId }
    );
    if (!fixture) {
      throw new ApiError(404, 'Match not found');
    }

    // Try fetching registered squads for this fixture's teams
    let team1Players = [];
    let team2Players = [];

    const [reg1, reg2] = await Promise.all([
      Registration.findOne({ teamName: new RegExp(`^${fixture.team1.trim()}$`, 'i') }),
      Registration.findOne({ teamName: new RegExp(`^${fixture.team2.trim()}$`, 'i') }),
    ]);

    if (reg1) team1Players = reg1.players || [];
    if (reg2) team2Players = reg2.players || [];

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          matchId,
          fixtureId: fixture._id,
          tournamentId: fixture.tournamentId,
          groupName: fixture.groupName,
          status: fixture.status?.toUpperCase() || 'UPCOMING',
          team1: fixture.team1,
          team2: fixture.team2,
          team1AvailablePlayers: team1Players,
          team2AvailablePlayers: team2Players,
          isConfigured: false,
          isLockedByOther: false,
        },
        'Match metadata fetched (Not yet configured)'
      )
    );
  }

  // Check locking state
  const userId = req.user?._id;
  const isLockExpired =
    !session.lock?.lastHeartbeat ||
    Date.now() - new Date(session.lock.lastHeartbeat).getTime() > LOCK_TIMEOUT_MS;

  const isSameAdmin =
    userId && session.lock?.activeAdminId &&
    session.lock.activeAdminId.toString() === userId.toString();

  const isLockedByOther =
    session.lock?.activeAdminId &&
    !isLockExpired &&
    !isSameAdmin;

  const isLockHeldByMe =
    isSameAdmin || (!session.lock?.activeAdminId && req.user?.role?.toLowerCase() === 'admin');

  res.status(200).json(
    new ApiResponse(
      200,
      formatSessionResponse(session, req.user?._id),
      'Match session fetched successfully'
    )
  );
});

/**
 * 3. Lock Management: Acquire, Heartbeat, Release
 */
export const acquireLock = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { forceSteal } = req.body;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId || crypto.randomUUID();

  const session = await MatchSession.findOne({ matchId });
  if (!session) {
    throw new ApiError(404, 'Match session not found');
  }

  const isLockExpired =
    session.lock?.lastHeartbeat &&
    Date.now() - new Date(session.lock.lastHeartbeat).getTime() > LOCK_TIMEOUT_MS;

  const isHeldByAnother =
    session.lock?.activeAdminId &&
    !isLockExpired &&
    session.lock.activeAdminId.toString() !== req.user._id.toString();

  if (isHeldByAnother && !forceSteal) {
    return res.status(423).json(
      new ApiResponse(
        423,
        {
          locked: true,
          activeAdminName: session.lock.activeAdminName,
          lastHeartbeat: session.lock.lastHeartbeat,
        },
        `Match is actively being scored by ${session.lock.activeAdminName}.`
      )
    );
  }

  // Grant lock
  session.lock = {
    activeAdminId: req.user._id,
    activeAdminName: req.user.name || req.user.username || 'Admin',
    sessionId: clientSessionId,
    acquiredAt: new Date(),
    lastHeartbeat: new Date(),
  };

  await session.save();

  res.status(200).json(
    new ApiResponse(200, { sessionId: clientSessionId }, 'Scoring lock acquired successfully')
  );
});

export const heartbeatLock = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;

  const session = await MatchSession.findOne({ matchId });
  if (!session) {
    throw new ApiError(404, 'Match session not found');
  }

  verifySessionLock(session, req.user._id, clientSessionId);

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, null, 'Heartbeat acknowledged'));
});

export const releaseLock = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;

  const session = await MatchSession.findOne({ matchId });
  if (!session) {
    throw new ApiError(404, 'Match session not found');
  }

  if (
    session.lock?.activeAdminId &&
    session.lock.activeAdminId.toString() === req.user._id.toString()
  ) {
    session.lock = {
      activeAdminId: null,
      activeAdminName: null,
      sessionId: null,
      acquiredAt: null,
      lastHeartbeat: null,
    };
    await session.save();
  }

  res.status(200).json(new ApiResponse(200, null, 'Lock released successfully'));
});

/**
 * 4. Record a Ball Delivery
 */
export const recordDelivery = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;
  const {
    runsOffBat = 0,
    extraType = 'NONE', // 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE'
    additionalRanRuns = 0,
    isWicket = false,
    dismissal = null,
  } = req.body;

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');
  if (session.status !== 'LIVE') throw new ApiError(400, 'Match is not in LIVE scoring state');

  verifySessionLock(session, req.user._id, clientSessionId);

  const curInningsIdx = session.currentInnings - 1;
  const innings = session.innings[curInningsIdx];
  if (!innings || innings.status === 'COMPLETED') {
    throw new ApiError(400, 'Current innings is already completed');
  }

  const live = session.liveState;
  const strikerName = live.striker;
  const nonStrikerName = live.nonStriker;
  const bowlerName = live.currentBowler;

  if (!strikerName || !nonStrikerName || !bowlerName) {
    throw new ApiError(400, 'Active Striker, Non-striker, and Bowler must be set before recording delivery');
  }

  // Determine delivery legality & extra runs
  let isLegalDelivery = true;
  let extraPenalty = 0;
  let extraTypeEnum = extraType ? extraType.toUpperCase() : 'NONE';

  if (extraTypeEnum === 'WIDE') {
    isLegalDelivery = false;
    extraPenalty = 1 + Number(additionalRanRuns || 0);
  } else if (extraTypeEnum === 'NO_BALL') {
    isLegalDelivery = false;
    extraPenalty = 1; // 1 penalty run
  } else if (extraTypeEnum === 'BYE' || extraTypeEnum === 'LEG_BYE') {
    isLegalDelivery = true;
    extraPenalty = Number(additionalRanRuns || runsOffBat || 0);
  }

  const batterRuns = extraTypeEnum === 'WIDE' || extraTypeEnum === 'BYE' || extraTypeEnum === 'LEG_BYE' ? 0 : Number(runsOffBat || 0);
  const totalRunsOnBall = (extraTypeEnum === 'WIDE' ? extraPenalty : (extraTypeEnum === 'BYE' || extraTypeEnum === 'LEG_BYE') ? extraPenalty : batterRuns + extraPenalty);

  // Snapshot before
  const scoreBefore = {
    runs: innings.totalRuns,
    wickets: innings.totalWickets,
    legalBalls: innings.totalLegalBalls,
  };

  // Find or create batsman scorecard records
  let strikerCard = innings.battingScorecard.find((b) => b.playerName.toLowerCase() === strikerName.toLowerCase());
  if (!strikerCard) {
    strikerCard = {
      playerName: strikerName,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      battingOrder: innings.battingScorecard.length + 1,
    };
    innings.battingScorecard.push(strikerCard);
  }

  let bowlerCard = innings.bowlingScorecard.find((b) => b.playerName.toLowerCase() === bowlerName.toLowerCase());
  if (!bowlerCard) {
    bowlerCard = {
      playerName: bowlerName,
      oversBowled: '0.0',
      ballsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      dotBalls: 0,
    };
    innings.bowlingScorecard.push(bowlerCard);
  }

  // Update Batsman Stats
  if (extraTypeEnum !== 'WIDE') {
    strikerCard.ballsFaced += 1;
  }
  strikerCard.runs += batterRuns;
  if (batterRuns === 4) strikerCard.fours += 1;
  if (batterRuns === 6) strikerCard.sixes += 1;

  // Update Bowler Stats
  let bowlerRunsCharged = 0;
  if (extraTypeEnum === 'WIDE') {
    bowlerCard.wides += 1;
    bowlerRunsCharged = extraPenalty;
  } else if (extraTypeEnum === 'NO_BALL') {
    bowlerCard.noBalls += 1;
    bowlerRunsCharged = 1 + batterRuns;
  } else if (extraTypeEnum === 'BYE' || extraTypeEnum === 'LEG_BYE') {
    bowlerRunsCharged = 0; // Byes/Legbyes don't charge bowler
  } else {
    bowlerRunsCharged = batterRuns;
    if (batterRuns === 0 && !isWicket) {
      bowlerCard.dotBalls += 1;
    }
  }

  bowlerCard.runsConceded += bowlerRunsCharged;

  if (isLegalDelivery) {
    bowlerCard.ballsBowled += 1;
    bowlerCard.oversBowled = ballsToOversStr(bowlerCard.ballsBowled);
    innings.totalLegalBalls += 1;
    live.legalBalls = innings.totalLegalBalls;
    live.bowlerOverDeliveries += 1;
  }

  // Update Team Extras & Totals
  if (extraTypeEnum === 'WIDE') innings.extras.wides += extraPenalty;
  else if (extraTypeEnum === 'NO_BALL') innings.extras.noBalls += 1;
  else if (extraTypeEnum === 'BYE') innings.extras.byes += extraPenalty;
  else if (extraTypeEnum === 'LEG_BYE') innings.extras.legByes += extraPenalty;
  innings.extras.total = innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes + innings.extras.penalty;

  innings.totalRuns += totalRunsOnBall;
  innings.oversFormatted = ballsToOversStr(innings.totalLegalBalls);
  live.runs = innings.totalRuns;
  live.oversDisplay = innings.oversFormatted;

  // Process Wicket
  let didWicketHappen = false;
  let nextStriker = strikerName;
  let nextNonStriker = nonStrikerName;

  if (isWicket && dismissal) {
    didWicketHappen = true;
    innings.totalWickets += 1;
    live.wickets = innings.totalWickets;

    const outPlayer = dismissal.batsmanOut?.trim() || strikerName;
    const isBowlerWicket = !['RUN_OUT', 'RETIRED_HURT'].includes(dismissal.dismissalType);

    if (isBowlerWicket) {
      bowlerCard.wickets += 1;
    }

    // Mark batsman out
    const outCard = innings.battingScorecard.find((b) => b.playerName.toLowerCase() === outPlayer.toLowerCase());
    if (outCard) {
      outCard.isOut = dismissal.dismissalType !== 'RETIRED_HURT';
      outCard.dismissal = {
        ...dismissal,
        bowler: bowlerName,
        bowlerCredited: isBowlerWicket,
      };
    }

    // Fall of wicket
    innings.fallOfWickets.push({
      wicketNumber: innings.totalWickets,
      score: innings.totalRuns,
      over: innings.oversFormatted,
      batsmanOut: outPlayer,
    });

    // Assign new batsman if provided
    const newBatter = (dismissal.newBatsman || '').trim();
    if (newBatter) {
      let newBatterCard = innings.battingScorecard.find((b) => b.playerName.toLowerCase() === newBatter.toLowerCase());
      if (!newBatterCard) {
        innings.battingScorecard.push({
          playerName: newBatter,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          battingOrder: innings.battingScorecard.length + 1,
        });
      }

      if (outPlayer.toLowerCase() === strikerName.toLowerCase()) {
        nextStriker = newBatter;
      } else {
        nextNonStriker = newBatter;
      }
    }
  }

  // Strike Rotation Logic
  let didStrikeChange = false;
  const isOddRun = totalRunsOnBall % 2 !== 0;

  if (!didWicketHappen && isOddRun) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
    didStrikeChange = true;
  }

  // Over End Check
  let didOverEnd = false;
  if (live.bowlerOverDeliveries >= 6) {
    didOverEnd = true;
    live.bowlerOverDeliveries = 0;
    // Rotate strike at end of over
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
  }

  live.striker = nextStriker;
  live.nonStriker = nextNonStriker;

  // Build Telemetry chip
  let token = `${totalRunsOnBall}`;
  if (extraTypeEnum === 'WIDE') token = `WD${extraPenalty > 1 ? '+' + (extraPenalty - 1) : ''}`;
  else if (extraTypeEnum === 'NO_BALL') token = `NB${batterRuns > 0 ? '+' + batterRuns : ''}`;
  else if (extraTypeEnum === 'BYE') token = `B${extraPenalty}`;
  else if (extraTypeEnum === 'LEG_BYE') token = `LB${extraPenalty}`;
  if (didWicketHappen) token = token === '0' ? 'W' : `W+${token}`;

  live.recentBalls = [token, ...live.recentBalls.slice(0, 11)];

  // Snapshot after
  const scoreAfter = {
    runs: innings.totalRuns,
    wickets: innings.totalWickets,
    legalBalls: innings.totalLegalBalls,
  };

  const ballEvent = {
    eventId: crypto.randomUUID(),
    inningsNumber: session.currentInnings,
    overNumber: Math.floor(scoreBefore.legalBalls / 6),
    ballInOver: (scoreBefore.legalBalls % 6) + (isLegalDelivery ? 1 : 0),
    isLegalDelivery,
    bowler: bowlerName,
    striker: strikerName,
    nonStriker: nonStrikerName,
    runsScoredOffBat: batterRuns,
    extras: {
      type: extraTypeEnum,
      extraRuns: extraPenalty,
      additionalRanRuns: Number(additionalRanRuns || 0),
    },
    totalRunsOnDelivery: totalRunsOnBall,
    isWicket: didWicketHappen,
    dismissal: isWicket ? dismissal : null,
    stateSnapshot: {
      scoreBefore,
      scoreAfter,
      strikerAfter: nextStriker,
      nonStrikerAfter: nextNonStriker,
      bowlerAfter: bowlerName,
      didStrikeChange,
      didOverEnd,
    },
    recordedBy: req.user._id,
    timestamp: new Date(),
  };

  innings.events.push(ballEvent);

  // Check Innings / Match Completion Criteria
  const maxBalls = session.config.totalOvers * 6;
  const maxWickets = session.config.playersPerSide - 1;

  const isAllOut = innings.totalWickets >= maxWickets;
  const isOversFinished = innings.totalLegalBalls >= maxBalls;
  const isTargetChased = session.currentInnings === 2 && session.target > 0 && innings.totalRuns >= session.target;

  if (session.currentInnings === 1) {
    if (isAllOut || isOversFinished) {
      innings.status = 'COMPLETED';
      session.status = 'INNINGS_BREAK';
      session.target = innings.totalRuns + 1;
      live.inningsStatus = 'COMPLETED';
    }
  } else if (session.currentInnings === 2) {
    if (isTargetChased || isAllOut || isOversFinished) {
      innings.status = 'COMPLETED';
      session.status = 'COMPLETED';
      live.inningsStatus = 'COMPLETED';

      const team1Score = session.innings[0].totalRuns;
      const team2Score = session.innings[1].totalRuns;
      const team1Name = session.toss.battingFirst;
      const team2Name = session.toss.bowlingFirst;

      let winner = '';
      let isTie = false;
      let margin = '';

      if (team2Score > team1Score) {
        winner = team2Name;
        const wicketsLeft = maxWickets - session.innings[1].totalWickets;
        margin = `Won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
      } else if (team1Score > team2Score) {
        winner = team1Name;
        const runMargin = team1Score - team2Score;
        margin = `Won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
      } else {
        isTie = true;
        margin = 'Match Tied';
      }

      session.result = {
        winnerTeam: winner,
        isTie,
        margin,
        completedAt: new Date(),
      };

      // Update Fixture as COMPLETED
      await Fixture.findByIdAndUpdate(session.fixtureId, {
        status: 'COMPLETED',
        result: isTie ? 'Match Tied' : `${winner} ${margin}`,
        score: {
          team1Runs: session.innings[0].totalRuns,
          team1Wickets: session.innings[0].totalWickets,
          team1Overs: session.innings[0].oversFormatted,
          team2Runs: session.innings[1].totalRuns,
          team2Wickets: session.innings[1].totalWickets,
          team2Overs: session.innings[1].oversFormatted,
        },
      });
    }
  }

  // Update Fixture live score snapshot
  if (session.status !== 'COMPLETED') {
    const isTeam1Batting = session.innings[curInningsIdx].battingTeam.toLowerCase() === (await Fixture.findById(session.fixtureId))?.team1.toLowerCase();
    await Fixture.findByIdAndUpdate(session.fixtureId, {
      status: 'LIVE',
      score: {
        team1Runs: isTeam1Batting ? session.innings[0]?.totalRuns || 0 : session.innings[1]?.totalRuns || 0,
        team1Wickets: isTeam1Batting ? session.innings[0]?.totalWickets || 0 : session.innings[1]?.totalWickets || 0,
        team1Overs: isTeam1Batting ? session.innings[0]?.oversFormatted || '0.0' : session.innings[1]?.oversFormatted || '0.0',
        team2Runs: !isTeam1Batting ? session.innings[0]?.totalRuns || 0 : session.innings[1]?.totalRuns || 0,
        team2Wickets: !isTeam1Batting ? session.innings[0]?.totalWickets || 0 : session.innings[1]?.totalWickets || 0,
        team2Overs: !isTeam1Batting ? session.innings[0]?.oversFormatted || '0.0' : session.innings[1]?.oversFormatted || '0.0',
      },
    });
  }

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Delivery recorded successfully'));
});

/**
 * 5. Undo Previous Delivery
 */
export const undoDelivery = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  verifySessionLock(session, req.user._id, clientSessionId);

  const curInningsIdx = session.currentInnings - 1;
  const innings = session.innings[curInningsIdx];
  if (!innings || !innings.events || innings.events.length === 0) {
    throw new ApiError(400, 'No deliveries available to undo for current innings');
  }

  const lastEvent = innings.events.pop();
  const { scoreBefore } = lastEvent.stateSnapshot;

  // Reverse Batsman stats
  const strikerCard = innings.battingScorecard.find(
    (b) => b.playerName.toLowerCase() === lastEvent.striker.toLowerCase()
  );
  if (strikerCard) {
    if (lastEvent.isLegalDelivery || lastEvent.extras.type !== 'WIDE') {
      strikerCard.ballsFaced = Math.max(0, strikerCard.ballsFaced - 1);
    }
    strikerCard.runs = Math.max(0, strikerCard.runs - lastEvent.runsScoredOffBat);
    if (lastEvent.runsScoredOffBat === 4) strikerCard.fours = Math.max(0, strikerCard.fours - 1);
    if (lastEvent.runsScoredOffBat === 6) strikerCard.sixes = Math.max(0, strikerCard.sixes - 1);
  }

  // Reverse Bowler stats
  const bowlerCard = innings.bowlingScorecard.find(
    (b) => b.playerName.toLowerCase() === lastEvent.bowler.toLowerCase()
  );
  if (bowlerCard) {
    let bowlerRunsToDeduct = 0;
    if (lastEvent.extras.type === 'WIDE') {
      bowlerCard.wides = Math.max(0, bowlerCard.wides - 1);
      bowlerRunsToDeduct = lastEvent.extras.extraRuns;
    } else if (lastEvent.extras.type === 'NO_BALL') {
      bowlerCard.noBalls = Math.max(0, bowlerCard.noBalls - 1);
      bowlerRunsToDeduct = 1 + lastEvent.runsScoredOffBat;
    } else if (lastEvent.extras.type === 'BYE' || lastEvent.extras.type === 'LEG_BYE') {
      bowlerRunsToDeduct = 0;
    } else {
      bowlerRunsToDeduct = lastEvent.runsScoredOffBat;
      if (lastEvent.runsScoredOffBat === 0 && !lastEvent.isWicket) {
        bowlerCard.dotBalls = Math.max(0, bowlerCard.dotBalls - 1);
      }
    }

    bowlerCard.runsConceded = Math.max(0, bowlerCard.runsConceded - bowlerRunsToDeduct);

    if (lastEvent.isLegalDelivery) {
      bowlerCard.ballsBowled = Math.max(0, bowlerCard.ballsBowled - 1);
      bowlerCard.oversBowled = ballsToOversStr(bowlerCard.ballsBowled);
    }

    if (lastEvent.isWicket && lastEvent.dismissal && !['RUN_OUT', 'RETIRED_HURT'].includes(lastEvent.dismissal.dismissalType)) {
      bowlerCard.wickets = Math.max(0, bowlerCard.wickets - 1);
    }
  }

  // Reverse Extras
  if (lastEvent.extras.type === 'WIDE') innings.extras.wides = Math.max(0, innings.extras.wides - lastEvent.extras.extraRuns);
  else if (lastEvent.extras.type === 'NO_BALL') innings.extras.noBalls = Math.max(0, innings.extras.noBalls - 1);
  else if (lastEvent.extras.type === 'BYE') innings.extras.byes = Math.max(0, innings.extras.byes - lastEvent.extras.extraRuns);
  else if (lastEvent.extras.type === 'LEG_BYE') innings.extras.legByes = Math.max(0, innings.extras.legByes - lastEvent.extras.extraRuns);
  innings.extras.total = innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes + innings.extras.penalty;

  // Reverse Wicket
  if (lastEvent.isWicket && lastEvent.dismissal) {
    innings.fallOfWickets.pop();
    const outCard = innings.battingScorecard.find(
      (b) => b.playerName.toLowerCase() === lastEvent.dismissal.batsmanOut.toLowerCase()
    );
    if (outCard) {
      outCard.isOut = false;
      outCard.dismissal = null;
    }
  }

  // Restore totals from scoreBefore snapshot
  innings.totalRuns = scoreBefore.runs;
  innings.totalWickets = scoreBefore.wickets;
  innings.totalLegalBalls = scoreBefore.legalBalls;
  innings.oversFormatted = ballsToOversStr(scoreBefore.legalBalls);

  // Restore LiveState
  session.liveState.runs = scoreBefore.runs;
  session.liveState.wickets = scoreBefore.wickets;
  session.liveState.legalBalls = scoreBefore.legalBalls;
  session.liveState.oversDisplay = innings.oversFormatted;
  session.liveState.striker = lastEvent.striker;
  session.liveState.nonStriker = lastEvent.nonStriker;
  session.liveState.currentBowler = lastEvent.bowler;
  session.liveState.bowlerOverDeliveries = scoreBefore.legalBalls % 6;
  session.liveState.recentBalls.shift(); // Remove last chip

  // If match or innings had been marked completed, revert to LIVE
  if (session.status === 'COMPLETED' || session.status === 'INNINGS_BREAK') {
    session.status = 'LIVE';
    innings.status = 'IN_PROGRESS';
    session.liveState.inningsStatus = 'IN_PROGRESS';
    session.result = null;

    await Fixture.findByIdAndUpdate(session.fixtureId, {
      status: 'LIVE',
      result: '',
    });
  }

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Previous delivery successfully undone'));
});

/**
 * 6. Swap Strike (Manual Striker ↔ Non-striker override)
 */
export const swapStrike = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  verifySessionLock(session, req.user._id, clientSessionId);

  const temp = session.liveState.striker;
  session.liveState.striker = session.liveState.nonStriker;
  session.liveState.nonStriker = temp;

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Strike swapped successfully'));
});

/**
 * 7. Change Bowler (At end of over or manual selection)
 */
export const changeBowler = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;
  const { newBowler } = req.body;

  if (!newBowler || !newBowler.trim()) {
    throw new ApiError(400, 'New bowler name is required');
  }

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  verifySessionLock(session, req.user._id, clientSessionId);

  const cleanedNewBowler = newBowler.trim();
  const curInningsIdx = session.currentInnings - 1;
  const innings = session.innings[curInningsIdx];

  // Consecutive bowler validation (if not at ball 0 of over 1)
  if (
    innings.events.length > 0 &&
    session.liveState.currentBowler.toLowerCase() === cleanedNewBowler.toLowerCase() &&
    session.liveState.bowlerOverDeliveries === 0
  ) {
    throw new ApiError(400, 'Same bowler cannot bowl consecutive overs');
  }

  // Quota validation if compulsory
  if (session.config.isBowlingLimitStrict) {
    const bowlerCard = innings.bowlingScorecard.find(
      (b) => b.playerName.toLowerCase() === cleanedNewBowler.toLowerCase()
    );
    if (bowlerCard) {
      const completedOvers = Math.floor(bowlerCard.ballsBowled / 6);
      if (completedOvers >= session.config.maxOversPerBowler) {
        throw new ApiError(
          400,
          `Bowler "${cleanedNewBowler}" has already completed their quota limit of ${session.config.maxOversPerBowler} over(s)`
        );
      }
    }
  }

  session.liveState.currentBowler = cleanedNewBowler;

  // Add bowler to scorecard if first time bowling
  let bowlerCard = innings.bowlingScorecard.find(
    (b) => b.playerName.toLowerCase() === cleanedNewBowler.toLowerCase()
  );
  if (!bowlerCard) {
    innings.bowlingScorecard.push({
      playerName: cleanedNewBowler,
      oversBowled: '0.0',
      ballsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      dotBalls: 0,
    });
  }

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), `Bowler changed to ${cleanedNewBowler}`));
});

/**
 * 8. Substitute / Replace Player
 */
export const substitutePlayer = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;
  const { teamName, playerOut, playerIn, reason = 'Tactical' } = req.body;

  if (!teamName || !playerOut || !playerIn) {
    throw new ApiError(400, 'Team name, outgoing player, and replacement player are required');
  }

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  verifySessionLock(session, req.user._id, clientSessionId);

  const isTeam1 = teamName.trim().toLowerCase() === session.team1Squad.teamName.toLowerCase();
  const squad = isTeam1 ? session.team1Squad : session.team2Squad;

  const subIndex = squad.substitutes.findIndex(
    (s) => s.name.trim().toLowerCase() === playerIn.trim().toLowerCase()
  );
  if (subIndex === -1) {
    throw new ApiError(400, `Player "${playerIn}" is not in the registered substitute list for ${teamName}`);
  }

  const playIndex = squad.playing.findIndex(
    (p) => p.name.trim().toLowerCase() === playerOut.trim().toLowerCase()
  );
  if (playIndex === -1) {
    throw new ApiError(400, `Player "${playerOut}" is not in the playing squad for ${teamName}`);
  }

  // Swap playing and substitute record
  const outgoingObj = squad.playing[playIndex];
  const incomingObj = squad.substitutes[subIndex];

  squad.playing[playIndex] = incomingObj;
  squad.substitutes[subIndex] = outgoingObj;

  // Log substitution
  session.substitutions.push({
    inningsNumber: session.currentInnings,
    over: Math.floor(session.liveState.legalBalls / 6),
    ball: session.liveState.legalBalls % 6,
    teamName: teamName.trim(),
    playerOut: playerOut.trim(),
    playerIn: playerIn.trim(),
    reason: reason.trim(),
    timestamp: new Date(),
  });

  // If outgoing was active batsman/bowler, update live state
  if (session.liveState.striker.toLowerCase() === playerOut.trim().toLowerCase()) {
    session.liveState.striker = playerIn.trim();
  }
  if (session.liveState.nonStriker.toLowerCase() === playerOut.trim().toLowerCase()) {
    session.liveState.nonStriker = playerIn.trim();
  }
  if (session.liveState.currentBowler.toLowerCase() === playerOut.trim().toLowerCase()) {
    session.liveState.currentBowler = playerIn.trim();
  }

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Player replacement recorded successfully'));
});

/**
 * 9. Start Second Innings (Select Openers)
 */
export const startSecondInnings = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers['x-scoring-session-id'] || req.body.sessionId;
  const { striker, nonStriker, openingBowler } = req.body;

  if (!striker || !nonStriker || !openingBowler) {
    throw new ApiError(400, 'Striker, Non-striker, and Opening Bowler are required for Innings 2');
  }

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  verifySessionLock(session, req.user._id, clientSessionId);

  if (session.currentInnings !== 1 || session.status !== 'INNINGS_BREAK') {
    throw new ApiError(400, 'Cannot start 2nd innings unless 1st innings is finished');
  }

  const battingTeam2 = session.toss.bowlingFirst;
  const bowlingTeam2 = session.toss.battingFirst;

  const innings2 = {
    inningsNumber: 2,
    battingTeam: battingTeam2,
    bowlingTeam: bowlingTeam2,
    totalRuns: 0,
    totalWickets: 0,
    totalLegalBalls: 0,
    oversFormatted: '0.0',
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
    battingScorecard: [
      { playerName: striker.trim(), runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
      { playerName: nonStriker.trim(), runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
    ],
    bowlingScorecard: [
      { playerName: openingBowler.trim(), oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
    ],
    fallOfWickets: [],
    events: [],
    status: 'IN_PROGRESS',
  };

  session.currentInnings = 2;
  session.status = 'LIVE';
  session.innings[1] = innings2;

  session.liveState = {
    battingTeam: battingTeam2,
    bowlingTeam: bowlingTeam2,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    oversDisplay: '0.0',
    striker: striker.trim(),
    nonStriker: nonStriker.trim(),
    currentBowler: openingBowler.trim(),
    bowlerOverDeliveries: 0,
    inningsStatus: 'IN_PROGRESS',
    recentBalls: [],
  };

  session.lock.lastHeartbeat = new Date();
  await session.save();

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Second innings started successfully'));
});

/**
 * 10. End / Complete Match Manually (Admin Action)
 */
export const endMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const clientSessionId = req.headers?.['x-scoring-session-id'] || req.body?.sessionId;
  const { action, status, stoppedReason, stoppedDetails, winnerTeam, margin, customResult } = req.body || {};

  const session = await MatchSession.findOne({ matchId });
  if (!session) throw new ApiError(404, 'Match session not found');

  if (req.user?._id) {
    verifySessionLock(session, req.user._id, clientSessionId);
  }

  const isStopping = action === 'STOPPED' || status === 'STOPPED';

  if (isStopping) {
    session.innings.forEach(inn => {
      if (inn.status === 'IN_PROGRESS') {
        inn.status = 'STOPPED';
      }
    });

    session.status = 'STOPPED';
    session.stoppedAt = new Date();
    session.stoppedReason = stoppedReason || 'Other';
    session.stoppedDetails = stoppedDetails || '';

    if (session.liveState) {
      session.liveState.inningsStatus = 'STOPPED';
    }

    const stopDisplay = stoppedDetails
      ? `Match Stopped (${session.stoppedReason}: ${stoppedDetails})`
      : `Match Stopped (${session.stoppedReason})`;

    session.result = {
      winnerTeam: '',
      isTie: false,
      margin: stopDisplay,
      completedAt: new Date(),
    };

    // Release lock
    session.lock.isLocked = false;
    session.lock.activeAdminId = null;
    session.lock.sessionId = null;

    await session.save();

    // Update Fixture as STOPPED (Do not alter winner/points table)
    await Fixture.findByIdAndUpdate(session.fixtureId, {
      status: 'STOPPED',
      result: stopDisplay,
      stoppedReason: stoppedReason || 'Technical Error',
      stoppedReasonDescription: stoppedDetails || '',
      score: {
        team1Runs: session.innings[0]?.totalRuns || 0,
        team1Wickets: session.innings[0]?.totalWickets || 0,
        team1Overs: session.innings[0]?.oversFormatted || '0.0',
        team2Runs: session.innings[1]?.totalRuns || 0,
        team2Wickets: session.innings[1]?.totalWickets || 0,
        team2Overs: session.innings[1]?.oversFormatted || '0.0',
      },
    });

    return res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Match marked as stopped'));
  }

  // Mark all innings status as COMPLETED
  session.innings.forEach(inn => {
    if (inn.status === 'IN_PROGRESS') {
      inn.status = 'COMPLETED';
    }
  });

  session.status = 'COMPLETED';
  if (session.liveState) {
    session.liveState.inningsStatus = 'COMPLETED';
  }

  // Calculate winner if not provided
  const team1Score = session.innings[0]?.totalRuns || 0;
  const team2Score = session.innings[1]?.totalRuns || 0;
  const team1Name = session.toss?.battingFirst || session.innings[0]?.battingTeam;
  const team2Name = session.toss?.bowlingFirst || session.innings[1]?.battingTeam;

  let calculatedWinner = winnerTeam || '';
  let calculatedMargin = margin || '';
  let isTie = false;

  if (!calculatedWinner && session.innings.length > 1) {
    if (team2Score > team1Score) {
      calculatedWinner = team2Name;
      const wicketsLeft = (session.config?.playersPerSide || 11) - 1 - (session.innings[1]?.totalWickets || 0);
      calculatedMargin = `Won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    } else if (team1Score > team2Score) {
      calculatedWinner = team1Name;
      const runMargin = team1Score - team2Score;
      calculatedMargin = `Won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
    } else {
      isTie = true;
      calculatedMargin = 'Match Tied';
    }
  } else if (!calculatedWinner && session.innings.length === 1) {
    calculatedWinner = team1Name;
    calculatedMargin = customResult || 'Match Concluded';
  }

  const finalResult = customResult || (isTie ? 'Match Tied' : `${calculatedWinner} ${calculatedMargin}`.trim());

  session.result = {
    winnerTeam: calculatedWinner,
    isTie,
    margin: calculatedMargin,
    completedAt: new Date(),
  };

  // Release lock
  session.lock.isLocked = false;
  session.lock.activeAdminId = null;
  session.lock.sessionId = null;

  await session.save();

  // Update Fixture as COMPLETED
  await Fixture.findByIdAndUpdate(session.fixtureId, {
    status: 'COMPLETED',
    result: finalResult,
    score: {
      team1Runs: session.innings[0]?.totalRuns || 0,
      team1Wickets: session.innings[0]?.totalWickets || 0,
      team1Overs: session.innings[0]?.oversFormatted || '0.0',
      team2Runs: session.innings[1]?.totalRuns || 0,
      team2Wickets: session.innings[1]?.totalWickets || 0,
      team2Overs: session.innings[1]?.oversFormatted || '0.0',
    },
  });

  res.status(200).json(new ApiResponse(200, formatSessionResponse(session, req.user?._id), 'Match completed and saved successfully'));
});

/**
 * 13. Get all active LIVE matches across tournaments (Public)
 */
export const getLiveMatchesList = asyncHandler(async (req, res) => {
  const liveFixtures = await Fixture.find({
    status: { $in: ['LIVE', 'live', 'IN_PROGRESS', 'in_progress', 'INNINGS_BREAK', 'innings_break'] },
  }).sort({ updatedAt: -1 });

  const matchIds = liveFixtures.map((f) => f.matchId);
  const sessions = await MatchSession.find({ matchId: { $in: matchIds } });

  const sessionMap = new Map();
  sessions.forEach((s) => sessionMap.set(s.matchId, s));

  const list = liveFixtures.map((f) => {
    const s = sessionMap.get(f.matchId);
    const liveState = s?.liveState || {};
    return {
      _id: f._id,
      matchId: f.matchId,
      fixtureId: f._id,
      tournamentId: f.tournamentId,
      groupName: f.groupName,
      matchTitle: f.matchTitle || f.round || 'Group Stage Match',
      round: f.round || f.matchTitle || 'Group Stage Match',
      team1: f.team1,
      team2: f.team2,
      team1Logo: f.team1Logo || null,
      team2Logo: f.team2Logo || null,
      ground: f.ground || 'Turf Stadium',
      date: f.date,
      time: f.time,
      status: 'LIVE',
      currentScore: {
        battingTeam: liveState.battingTeam || f.team1,
        bowlingTeam: liveState.bowlingTeam || f.team2,
        runs: liveState.runs || 0,
        wickets: liveState.wickets || 0,
        overs: liveState.oversDisplay || '0.0',
        target: s?.target || 0,
        currentInnings: s?.currentInnings || 1,
        striker: liveState.striker || '',
        nonStriker: liveState.nonStriker || '',
        currentBowler: liveState.currentBowler || '',
      },
    };
  });

  res.status(200).json(
    new ApiResponse(200, list, 'Live matches fetched successfully')
  );
});

/**
 * 14. Reset / Undo Match Start back to UPCOMING (Admin only, 0 deliveries recorded only)
 */
export const resetMatchStart = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const fixture = await Fixture.findOne(
    mongoose.Types.ObjectId.isValid(matchId)
      ? { $or: [{ matchId }, { _id: matchId }] }
      : { matchId }
  );
  if (!fixture) {
    throw new ApiError(404, 'Fixture not found for this match');
  }

  const session = await MatchSession.findOne(
    mongoose.Types.ObjectId.isValid(matchId)
      ? { $or: [{ matchId }, { fixtureId: matchId }] }
      : { matchId }
  );
  if (session) {
    let totalDeliveries = 0;
    if (session.innings && session.innings.length > 0) {
      for (const inn of session.innings) {
        if (inn.events && inn.events.length > 0) {
          totalDeliveries += inn.events.length;
        }
      }
    }

    if (totalDeliveries > 0) {
      throw new ApiError(
        400,
        `Cannot reset match start: ${totalDeliveries} delivery(ies) have already been recorded. Scoring has already started. Use "Undo Last Ball" instead.`
      );
    }

    // Cleanly delete the active match session document
    await MatchSession.deleteOne({ _id: session._id });
  }

  // Reset fixture state back to UPCOMING
  fixture.status = 'UPCOMING';
  fixture.score = {
    team1Runs: 0,
    team1Wickets: 0,
    team1Overs: '0.0',
    team2Runs: 0,
    team2Wickets: 0,
    team2Overs: '0.0',
  };
  fixture.result = '';
  await fixture.save();

  res.status(200).json(
    new ApiResponse(200, { matchId, status: 'UPCOMING' }, 'Match start reset back to UPCOMING successfully')
  );
});

