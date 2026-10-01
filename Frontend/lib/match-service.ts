import { apiFetch } from './api';

export interface PlayerInfo {
  name: string;
  jerseyNumber?: string;
  role?: string;
  isSubstitute?: boolean;
}

export interface MatchConfig {
  totalOvers: number;
  playersPerSide: number;
  maxOversPerBowler: number;
  isBowlingLimitStrict: boolean;
}

export interface TeamSquad {
  teamName: string;
  playing: PlayerInfo[];
  substitutes: PlayerInfo[];
  wicketKeeper?: string;
}

export interface TossInfo {
  wonBy: string;
  electedTo: 'BAT' | 'BOWL';
  battingFirst: string;
  bowlingFirst: string;
}

export interface BatsmanCard {
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal?: {
    dismissalType: string;
    bowler?: string;
    fielderCatcher?: string;
    wicketKeeper?: string;
    runOutDetails?: {
      thrower?: string;
      isDirectHit?: boolean;
      assistingFielder?: string;
    };
  };
  battingOrder: number;
}

export interface BowlerCard {
  playerName: string;
  oversBowled: string;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  dotBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  over: string;
  batsmanOut: string;
}

export interface BallEvent {
  eventId: string;
  inningsNumber: number;
  overNumber: number;
  ballInOver: number;
  isLegalDelivery: boolean;
  bowler: string;
  striker: string;
  nonStriker: string;
  runsScoredOffBat: number;
  extras: {
    type: string;
    extraRuns: number;
    additionalRanRuns: number;
  };
  totalRunsOnDelivery: number;
  isWicket: boolean;
  timestamp: string;
}

export interface InningsData {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalLegalBalls: number;
  oversFormatted: string;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  battingScorecard: BatsmanCard[];
  bowlingScorecard: BowlerCard[];
  fallOfWickets: FallOfWicket[];
  events: BallEvent[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
}

export interface MatchSessionData {
  _id?: string;
  matchId: string;
  fixtureId: string;
  tournamentId: string;
  groupName: string;
  config: MatchConfig;
  team1Squad: TeamSquad;
  team2Squad: TeamSquad;
  toss: TossInfo;
  status: 'SETUP' | 'LIVE' | 'INNINGS_BREAK' | 'COMPLETED' | 'ABANDONED' | 'STOPPED';
  stoppedAt?: string | null;
  stoppedReason?: string;
  stoppedDetails?: string;
  currentInnings: 1 | 2;
  target?: number;
  liveState: {
    battingTeam: string;
    bowlingTeam: string;
    runs: number;
    wickets: number;
    legalBalls: number;
    oversDisplay: string;
    striker: string;
    nonStriker: string;
    currentBowler: string;
    bowlerOverDeliveries: number;
    inningsStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
    recentBalls: string[];
  };
  innings: InningsData[];
  lock: {
    activeAdminId: string | null;
    activeAdminName: string | null;
    sessionId: string | null;
    acquiredAt: string | null;
    lastHeartbeat: string | null;
    isLocked?: boolean;
  };
  result?: {
    winnerTeam: string;
    isTie: boolean;
    margin: string;
    playerOfTheMatch?: string;
    completedAt?: string;
  };
  isConfigured?: boolean;
  isLockedByOther?: boolean;
  isLockHeldByMe?: boolean;
  lockedByAdminName?: string | null;
  team1?: string;
  team2?: string;
  team1AvailablePlayers?: PlayerInfo[];
  team2AvailablePlayers?: PlayerInfo[];
}

export interface SetupMatchPayload {
  config: MatchConfig;
  team1Squad: TeamSquad;
  team2Squad: TeamSquad;
  toss: {
    wonBy: string;
    electedTo: 'BAT' | 'BOWL';
  };
  openers: {
    striker: string;
    nonStriker: string;
    openingBowler: string;
  };
  sessionId?: string;
}

export interface RecordDeliveryPayload {
  runsOffBat?: number;
  extraType?: 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE';
  additionalRanRuns?: number;
  isWicket?: boolean;
  dismissal?: {
    batsmanOut: string;
    dismissalType: string;
    fielderCatcher?: string;
    wicketKeeper?: string;
    runOutDetails?: {
      thrower?: string;
      isDirectHit?: boolean;
      assistingFielder?: string;
    };
    newBatsman?: string;
    newBatsmanStrike?: 'STRIKER' | 'NON_STRIKER';
  };
  sessionId?: string;
}

// 1. Fetch match session
export async function getMatchSession(matchId: string, sessionId?: string): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) {
    headers['x-scoring-session-id'] = sessionId;
  }
  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/session`, { headers });
}

// 2. Setup match
export async function setupMatch(matchId: string, payload: SetupMatchPayload): Promise<{ session: MatchSessionData; sessionId: string }> {
  return apiFetch<{ session: MatchSessionData; sessionId: string }>(`/api/v1/matches/${matchId}/setup`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 3. Acquire lock
export async function acquireMatchLock(matchId: string, sessionId?: string, forceSteal = false): Promise<{ sessionId: string }> {
  return apiFetch<{ sessionId: string }>(`/api/v1/matches/${matchId}/lock/acquire`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, forceSteal }),
  });
}

// 4. Send heartbeat
export async function sendMatchHeartbeat(matchId: string, sessionId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/matches/${matchId}/lock/heartbeat`, {
    method: 'POST',
    headers: { 'x-scoring-session-id': sessionId },
    body: JSON.stringify({ sessionId }),
  });
}

// 5. Release lock
export async function releaseMatchLock(matchId: string, sessionId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/matches/${matchId}/lock/release`, {
    method: 'POST',
    headers: { 'x-scoring-session-id': sessionId },
    body: JSON.stringify({ sessionId }),
  });
}

// 6. Record delivery
export async function recordMatchDelivery(
  matchId: string,
  payload: RecordDeliveryPayload,
  sessionId?: string
): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, sessionId }),
  });
}

// 7. Undo delivery
export async function undoMatchDelivery(matchId: string, sessionId?: string): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/undo`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId }),
  });
}

// 8. Swap strike
export async function swapMatchStrike(matchId: string, sessionId?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<any>(`/api/v1/matches/${matchId}/strike/swap`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId }),
  });
}

// 9. Change bowler
export async function changeMatchBowler(matchId: string, newBowler: string, sessionId?: string): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/bowler/change`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ newBowler, sessionId }),
  });
}

// 10. Substitute player
export async function substituteMatchPlayer(
  matchId: string,
  payload: { teamName: string; playerOut: string; playerIn: string; reason?: string },
  sessionId?: string
): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/substitute`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, sessionId }),
  });
}

// 11. Start second innings
export async function startSecondInnings(
  matchId: string,
  payload: { striker: string; nonStriker: string; openingBowler: string },
  sessionId?: string
): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/innings/start-second`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, sessionId }),
  });
}

// 12. End Match (Admin action)
export async function endMatchSession(
  matchId: string,
  payload?: {
    action?: 'COMPLETED' | 'STOPPED';
    status?: 'COMPLETED' | 'STOPPED';
    stoppedReason?: string;
    stoppedDetails?: string;
    winnerTeam?: string;
    margin?: string;
    customResult?: string;
  },
  sessionId?: string
): Promise<MatchSessionData> {
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-scoring-session-id'] = sessionId;

  return apiFetch<MatchSessionData>(`/api/v1/matches/${matchId}/end`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, sessionId }),
  });
}

export interface LiveMatchSummary {
  _id: string;
  matchId: string;
  fixtureId: string;
  tournamentId: string;
  groupName: string;
  matchTitle: string;
  round: string;
  team1: string;
  team2: string;
  team1Logo?: string | null;
  team2Logo?: string | null;
  ground: string;
  date: string;
  time: string;
  status: 'LIVE';
  currentScore: {
    battingTeam: string;
    bowlingTeam: string;
    runs: number;
    wickets: number;
    overs: string;
    target: number;
    currentInnings: number;
    striker?: string;
    nonStriker?: string;
    currentBowler?: string;
  };
}

// 13. Fetch all active live matches
export async function getLiveMatchesList(): Promise<LiveMatchSummary[]> {
  return apiFetch<LiveMatchSummary[]>('/api/v1/matches/live');
}

// 14. Reset / Undo match start back to UPCOMING (0 deliveries only)
export async function resetMatchStart(matchId: string): Promise<{ matchId: string; status: 'UPCOMING' }> {
  return apiFetch<{ matchId: string; status: 'UPCOMING' }>(`/api/v1/matches/${matchId}/reset-start`, {
    method: 'POST',
  });
}


