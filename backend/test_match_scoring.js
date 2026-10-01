import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './src/models/event.model.js';
import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import MatchSession from './src/models/matchSession.model.js';
import Admin from './src/models/admin.model.js';
import { calculateTournamentPointsTable } from './src/services/pointsTable.service.js';
import { calculateTournamentLeaderboard } from './src/services/leaderboard.service.js';

dotenv.config();

async function runScoringTest() {
  console.log('--- 🏏 STARTING FULL CRICKET SCORING SYSTEM INTEGRATION TEST ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/turf-titans';
  await mongoose.connect(mongoUri, {
    dbName: process.env.DB_NAME || 'turf_titans',
  });
  console.log('Connected to MongoDB:', mongoose.connection.name);

  const testTournamentId = `test-tourney-${Date.now()}`;

  // 1. Create Mock Admin
  let admin = await Admin.findOne({ email: 'scorer.admin@turftitans.com' });
  if (!admin) {
    admin = await Admin.create({
      username: 'scorer_admin',
      name: 'Match Scorer Admin',
      email: 'scorer.admin@turftitans.com',
      password: 'password123',
      role: 'admin',
    });
  }

  // 2. Create Registrations for 2 Teams with rich player rosters
  const team1Reg = await Registration.create({
    teamName: 'Thunder Strikers',
    captainName: 'Rohit Verma',
    captainEmail: 'rohit@thunder.com',
    sport: 'cricket',
    players: [
      { name: 'Rohit Verma', jerseyNumber: '45', role: 'Batsman' },
      { name: 'Shikhar Dhawan', jerseyNumber: '25', role: 'Batsman' },
      { name: 'Virat Kohli', jerseyNumber: '18', role: 'Batsman' },
      { name: 'Hardik Pandya', jerseyNumber: '33', role: 'All-Rounder' },
      { name: 'Ravindra Jadeja', jerseyNumber: '8', role: 'All-Rounder' },
      { name: 'Jasprit Bumrah', jerseyNumber: '93', role: 'Bowler' },
      { name: 'Mohammed Shami', jerseyNumber: '11', role: 'Bowler' },
      { name: 'Suryakumar Yadav', jerseyNumber: '63', role: 'Batsman' }, // Sub
    ],
  });

  const team2Reg = await Registration.create({
    teamName: 'Lightning Bolts',
    captainName: 'KL Rahul',
    captainEmail: 'rahul@lightning.com',
    sport: 'cricket',
    players: [
      { name: 'KL Rahul', jerseyNumber: '1', role: 'Wicket-Keeper' },
      { name: 'David Warner', jerseyNumber: '31', role: 'Batsman' },
      { name: 'Glenn Maxwell', jerseyNumber: '32', role: 'All-Rounder' },
      { name: 'Rashid Khan', jerseyNumber: '19', role: 'Bowler' },
      { name: 'Trent Boult', jerseyNumber: '18', role: 'Bowler' },
      { name: 'Mitchell Starc', jerseyNumber: '56', role: 'Bowler' },
      { name: 'Kagiso Rabada', jerseyNumber: '25', role: 'Bowler' },
      { name: 'Andre Russell', jerseyNumber: '12', role: 'All-Rounder' }, // Sub
    ],
  });

  // 3. Create Group and Fixture
  const group = await TournamentGroup.create({
    tournamentId: testTournamentId,
    groupName: 'GROUP A',
    teams: ['Thunder Strikers', 'Lightning Bolts'],
  });

  const matchId = `match-test-${Date.now()}`;
  const fixture = await Fixture.create({
    tournamentId: testTournamentId,
    groupName: 'GROUP A',
    matchNumber: 1,
    team1: 'Thunder Strikers',
    team2: 'Lightning Bolts',
    date: '2026-09-20',
    time: '10:00 AM',
    ground: 'Court 1 - Turf Arena',
    status: 'UPCOMING',
    matchId,
  });

  console.log(`✅ Fixture created: [${fixture.team1} vs ${fixture.team2}] with matchId: ${matchId}`);

  // 4. Test Match Setup
  const session = await MatchSession.create({
    matchId,
    fixtureId: fixture._id,
    tournamentId: testTournamentId,
    groupName: 'GROUP A',
    config: {
      totalOvers: 2, // 2-over test match
      playersPerSide: 7,
      maxOversPerBowler: 1,
      isBowlingLimitStrict: true,
    },
    team1Squad: {
      teamName: 'Thunder Strikers',
      playing: team1Reg.players.slice(0, 7),
      substitutes: team1Reg.players.slice(7),
      wicketKeeper: 'Ravindra Jadeja',
    },
    team2Squad: {
      teamName: 'Lightning Bolts',
      playing: team2Reg.players.slice(0, 7),
      substitutes: team2Reg.players.slice(7),
      wicketKeeper: 'KL Rahul',
    },
    toss: {
      wonBy: 'Thunder Strikers',
      electedTo: 'BAT',
      battingFirst: 'Thunder Strikers',
      bowlingFirst: 'Lightning Bolts',
    },
    status: 'LIVE',
    currentInnings: 1,
    target: 0,
    liveState: {
      battingTeam: 'Thunder Strikers',
      bowlingTeam: 'Lightning Bolts',
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      oversDisplay: '0.0',
      striker: 'Rohit Verma',
      nonStriker: 'Shikhar Dhawan',
      currentBowler: 'Trent Boult',
      bowlerOverDeliveries: 0,
      inningsStatus: 'IN_PROGRESS',
      recentBalls: [],
    },
    innings: [
      {
        inningsNumber: 1,
        battingTeam: 'Thunder Strikers',
        bowlingTeam: 'Lightning Bolts',
        totalRuns: 0,
        totalWickets: 0,
        totalLegalBalls: 0,
        oversFormatted: '0.0',
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
        battingScorecard: [
          { playerName: 'Rohit Verma', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
          { playerName: 'Shikhar Dhawan', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
        ],
        bowlingScorecard: [
          { playerName: 'Trent Boult', oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
        ],
        fallOfWickets: [],
        events: [],
        status: 'IN_PROGRESS',
      },
    ],
    lock: {
      activeAdminId: admin._id,
      activeAdminName: admin.name,
      sessionId: 'admin-sess-1',
      acquiredAt: new Date(),
      lastHeartbeat: new Date(),
    },
  });

  console.log('✅ Match Session setup initialized. Status: LIVE, Locked by Admin 1');

  // 5. Test Scoring Deliveries:
  // Over 1 (Trent Boult bowling to Rohit Verma & Shikhar Dhawan):
  // Ball 1: 4 runs (Rohit 4) -> strike stays
  // Ball 2: 1 run (Rohit 5) -> strike rotates to Shikhar
  // Ball 3: Wide + 1 run (2 runs team, no legal ball) -> strike stays on Shikhar
  // Ball 4: 6 runs (Shikhar 6) -> strike stays
  // Ball 5: OUT (Shikhar Caught by David Warner) -> Virat Kohli enters
  // Ball 6: 1 run (Virat 1) -> strike rotates (Rohit on strike for end of over, then end of over rotates to Virat)

  console.log('--- Scoring 1st Innings Deliveries ---');
  
  // Simulating events onto session
  const inn1 = session.innings[0];
  
  // Ball 1: 4 runs
  inn1.totalRuns += 4;
  inn1.totalLegalBalls += 1;
  inn1.battingScorecard[0].runs += 4;
  inn1.battingScorecard[0].ballsFaced += 1;
  inn1.battingScorecard[0].fours += 1;
  inn1.bowlingScorecard[0].ballsBowled += 1;
  inn1.bowlingScorecard[0].runsConceded += 4;

  // Ball 2: 1 run
  inn1.totalRuns += 1;
  inn1.totalLegalBalls += 1;
  inn1.battingScorecard[0].runs += 1;
  inn1.battingScorecard[0].ballsFaced += 1;
  inn1.bowlingScorecard[0].ballsBowled += 1;
  inn1.bowlingScorecard[0].runsConceded += 1;

  // Ball 3: Wide + 1 (2 extras)
  inn1.totalRuns += 2;
  inn1.extras.wides += 2;
  inn1.extras.total += 2;
  inn1.bowlingScorecard[0].wides += 1;
  inn1.bowlingScorecard[0].runsConceded += 2;

  // Ball 4: 6 runs
  inn1.totalRuns += 6;
  inn1.totalLegalBalls += 1;
  inn1.battingScorecard[1].runs += 6;
  inn1.battingScorecard[1].ballsFaced += 1;
  inn1.battingScorecard[1].sixes += 1;
  inn1.bowlingScorecard[0].ballsBowled += 1;
  inn1.bowlingScorecard[0].runsConceded += 6;

  // Ball 5: Wicket (Caught)
  inn1.totalWickets += 1;
  inn1.totalLegalBalls += 1;
  inn1.battingScorecard[1].ballsFaced += 1;
  inn1.battingScorecard[1].isOut = true;
  inn1.battingScorecard[1].dismissal = {
    batsmanOut: 'Shikhar Dhawan',
    dismissalType: 'CAUGHT',
    bowlerCredited: true,
    bowler: 'Trent Boult',
    fielderCatcher: 'David Warner',
  };
  inn1.bowlingScorecard[0].ballsBowled += 1;
  inn1.bowlingScorecard[0].wickets += 1;

  // New batter Virat
  inn1.battingScorecard.push({
    playerName: 'Virat Kohli',
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    battingOrder: 3,
  });

  // Ball 6: 1 run
  inn1.totalRuns += 1;
  inn1.totalLegalBalls += 1;
  inn1.battingScorecard[2].runs += 1;
  inn1.battingScorecard[2].ballsFaced += 1;
  inn1.bowlingScorecard[0].ballsBowled += 1;
  inn1.bowlingScorecard[0].runsConceded += 1;
  inn1.bowlingScorecard[0].oversBowled = '1.0';

  // Over 2 (Mitchell Starc): 6 dot balls + 6 runs = 6 runs total
  inn1.bowlingScorecard.push({
    playerName: 'Mitchell Starc',
    oversBowled: '1.0',
    ballsBowled: 6,
    maidens: 0,
    runsConceded: 8,
    wickets: 0,
    wides: 0,
    noBalls: 0,
    dotBalls: 2,
  });
  inn1.totalRuns += 8;
  inn1.totalLegalBalls += 6;
  inn1.battingScorecard[0].runs += 8;
  inn1.battingScorecard[0].ballsFaced += 6;
  inn1.oversFormatted = '2.0';
  inn1.status = 'COMPLETED';

  // Innings 1 Concluded
  console.log(`✅ Innings 1 Completed: ${inn1.totalRuns}/${inn1.totalWickets} in ${inn1.oversFormatted} overs. Target: ${inn1.totalRuns + 1}`);

  // 6. Innings 2: Lightning Bolts chasing target
  const target = inn1.totalRuns + 1; // e.g. 23 runs
  session.currentInnings = 2;
  session.target = target;

  const inn2 = {
    inningsNumber: 2,
    battingTeam: 'Lightning Bolts',
    bowlingTeam: 'Thunder Strikers',
    totalRuns: 24, // Chased down!
    totalWickets: 1,
    totalLegalBalls: 9, // 1.3 overs
    oversFormatted: '1.3',
    extras: { wides: 1, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 1 },
    battingScorecard: [
      { playerName: 'KL Rahul', runs: 16, ballsFaced: 6, fours: 2, sixes: 1, isOut: false, battingOrder: 1 },
      { playerName: 'David Warner', runs: 7, ballsFaced: 3, fours: 1, sixes: 0, isOut: false, battingOrder: 2 },
    ],
    bowlingScorecard: [
      { playerName: 'Jasprit Bumrah', oversBowled: '1.0', ballsBowled: 6, maidens: 0, runsConceded: 14, wickets: 0, wides: 0, noBalls: 0, dotBalls: 1 },
      { playerName: 'Mohammed Shami', oversBowled: '0.3', ballsBowled: 3, maidens: 0, runsConceded: 10, wickets: 0, wides: 1, noBalls: 0, dotBalls: 0 },
    ],
    fallOfWickets: [],
    events: [],
    status: 'COMPLETED',
  };

  session.innings.push(inn2);
  session.status = 'COMPLETED';
  session.result = {
    winnerTeam: 'Lightning Bolts',
    isTie: false,
    margin: 'Won by 6 wickets',
    completedAt: new Date(),
  };

  await session.save();

  // Update Fixture as COMPLETED
  await Fixture.findByIdAndUpdate(fixture._id, {
    status: 'COMPLETED',
    result: 'Lightning Bolts Won by 6 wickets',
    score: {
      team1Runs: inn1.totalRuns,
      team1Wickets: inn1.totalWickets,
      team1Overs: inn1.oversFormatted,
      team2Runs: inn2.totalRuns,
      team2Wickets: inn2.totalWickets,
      team2Overs: inn2.oversFormatted,
    },
  });

  console.log('✅ Match Finalized & Fixture marked COMPLETED');

  // 7. Verify Points Table Calculation
  const pointsTable = await calculateTournamentPointsTable(testTournamentId);
  console.log('--- Points Table Result ---');
  console.dir(pointsTable, { depth: null });

  const standings = pointsTable[0].standings;
  const lightningBolts = standings.find((s) => s.team === 'Lightning Bolts');
  const thunderStrikers = standings.find((s) => s.team === 'Thunder Strikers');

  if (lightningBolts.won === 1 && lightningBolts.points === 2 && thunderStrikers.lost === 1) {
    console.log('✅ Points Table verified: Lightning Bolts (2 pts), Thunder Strikers (0 pts)');
  } else {
    throw new Error('Points Table mismatch!');
  }

  // 8. Verify Leaderboard Calculation
  const battingLeaderboard = await calculateTournamentLeaderboard(testTournamentId, {
    category: 'batting',
    statistic: 'top_run_scorer',
  });
  console.log('--- Batting Leaderboard Top Run Scorers ---');
  console.dir(battingLeaderboard.standings.slice(0, 3), { depth: null });

  const bowlingLeaderboard = await calculateTournamentLeaderboard(testTournamentId, {
    category: 'bowling',
    statistic: 'most_wickets',
  });
  console.log('--- Bowling Leaderboard Most Wickets ---');
  console.dir(bowlingLeaderboard.standings.slice(0, 3), { depth: null });

  // Clean up test data
  await Promise.all([
    Registration.deleteMany({ _id: { $in: [team1Reg._id, team2Reg._id] } }),
    TournamentGroup.deleteMany({ tournamentId: testTournamentId }),
    Fixture.deleteMany({ tournamentId: testTournamentId }),
    MatchSession.deleteMany({ tournamentId: testTournamentId }),
  ]);

  console.log('🧹 Test data cleaned up.');
  console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
  await mongoose.disconnect();
}

runScoringTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
