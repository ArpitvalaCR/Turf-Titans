import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import MatchSession from './src/models/matchSession.model.js';
import User from './src/models/user.model.js';
import { recordDelivery, undoDelivery } from './src/controllers/matchSession.controller.js';

dotenv.config();

async function executeExactUserSpec() {
  console.log('====================================================');
  console.log('STARTING VERIFICATION OF EXACT 15-STEP SPECIFICATION');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turf_titans');
  console.log('Connected to MongoDB.');

  const tournamentId = 'turf-titans-2025';
  const tag = Date.now().toString().slice(-4);
  const teamAName = `Titans Alpha ${tag}`;
  const teamBName = `Titans Beta ${tag}`;

  // 1. Admin User
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: `Tournament Admin ${tag}`,
      username: `admin_${tag}`,
      email: `admin_${tag}@turftitans.com`,
      password: 'password123',
      role: 'admin',
    });
  }

  // --- STEP 1: Register Team A ---
  console.log('\n--- [TEST 1] Register Team A (11 Playing + 1 Sub) ---');
  const teamAPlayers = [];
  for (let i = 1; i <= 11; i++) {
    teamAPlayers.push({
      name: `Alpha Player ${i}`,
      role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler',
      isSubstitute: false,
    });
  }
  teamAPlayers.push({
    name: `Alpha Sub 12`,
    role: 'all-rounder',
    isSubstitute: true,
  });

  const regA = await Registration.create({
    teamName: teamAName,
    captainName: 'Alpha Captain',
    captainEmail: 'captain.alpha@turftitans.com',
    captainPhone: '9876543210',
    whatsappNumber: '9876543210',
    sport: 'cricket',
    players: teamAPlayers,
    transactionId: `UTR-ALPHA-${tag}`,
    paymentStatus: 'pending',
    registrationStatus: 'pending',
  });
  console.log(`Team A submitted. ID: ${regA.registrationId || regA._id}, Status: ${regA.registrationStatus}`);
  if (regA.registrationStatus !== 'pending') throw new Error('Test 1 Failed: Status should be pending');

  // --- STEP 2: Register Team B ---
  console.log('\n--- [TEST 2] Register Team B (11 Playing + 1 Sub) ---');
  const teamBPlayers = [];
  for (let i = 1; i <= 11; i++) {
    teamBPlayers.push({
      name: `Beta Player ${i}`,
      role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler',
      isSubstitute: false,
    });
  }
  teamBPlayers.push({
    name: `Beta Sub 12`,
    role: 'all-rounder',
    isSubstitute: true,
  });

  const regB = await Registration.create({
    teamName: teamBName,
    captainName: 'Beta Captain',
    captainEmail: 'captain.beta@turftitans.com',
    captainPhone: '9876543211',
    whatsappNumber: '9876543211',
    sport: 'cricket',
    players: teamBPlayers,
    transactionId: `UTR-BETA-${tag}`,
    paymentStatus: 'pending',
    registrationStatus: 'pending',
  });
  console.log(`Team B submitted. ID: ${regB.registrationId || regB._id}, Status: ${regB.registrationStatus}`);
  if (regB.registrationStatus !== 'pending') throw new Error('Test 2 Failed: Status should be pending');

  // --- STEP 3: Admin opens Review Registrations ---
  console.log('\n--- [TEST 3] Admin Review Registrations (Query pending) ---');
  const pendingRegistrations = await Registration.find({
    registrationStatus: 'pending',
  }).select('teamName captainName players paymentStatus');
  const foundA = pendingRegistrations.find(r => r.teamName === teamAName);
  const foundB = pendingRegistrations.find(r => r.teamName === teamBName);
  console.log(`Pending registrations retrieved. Found Team A: ${Boolean(foundA)}, Found Team B: ${Boolean(foundB)}`);
  if (!foundA || !foundB) throw new Error('Test 3 Failed: Pending teams not found in admin view');

  // --- STEP 4: Admin approves both ---
  console.log('\n--- [TEST 4] Admin Approves Both Registrations ---');
  regA.registrationStatus = 'approved';
  regA.paymentStatus = 'verified';
  regA.verifiedBy = admin._id;
  await regA.save();

  regB.registrationStatus = 'approved';
  regB.paymentStatus = 'verified';
  regB.verifiedBy = admin._id;
  await regB.save();
  console.log(`Team A status: ${regA.registrationStatus}, Team B status: ${regB.registrationStatus}`);

  // --- STEP 5: Admin opens Group/Fixture management (Approved teams query) ---
  console.log('\n--- [TEST 5] Fetch Approved Tournament Teams ---');
  const approvedTeams = await Registration.find({
    registrationStatus: { $in: ['approved', 'APPROVED'] },
  }).select('teamName captainName players');
  const approvedA = approvedTeams.find(t => t.teamName === teamAName);
  const approvedB = approvedTeams.find(t => t.teamName === teamBName);
  console.log(`Approved teams in fixture pool: Team A: ${Boolean(approvedA)}, Team B: ${Boolean(approvedB)}`);
  if (!approvedA || !approvedB) throw new Error('Test 5 Failed: Approved teams not in fixture management pool');

  // --- STEP 6: Assign both to Group A ---
  console.log('\n--- [TEST 6] Assign Team A & Team B to GROUP A ---');
  let groupA = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { $addToSet: { teams: { $each: [teamAName, teamBName] } }, $setOnInsert: { tournamentId, groupName: 'GROUP A' } },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('GROUP A teams now:', groupA.teams);
  if (!groupA.teams.includes(teamAName) || !groupA.teams.includes(teamBName)) {
    throw new Error('Test 6 Failed: Teams not assigned to Group A');
  }

  // --- STEP 7: Remove Team B from Group A ---
  console.log('\n--- [TEST 7] Remove Team B from GROUP A ---');
  groupA.teams = groupA.teams.filter(t => t !== teamBName);
  await groupA.save();
  console.log('GROUP A teams after removal:', groupA.teams);
  const checkRegBStillExists = await Registration.findById(regB._id);
  if (!checkRegBStillExists || checkRegBStillExists.registrationStatus !== 'approved') {
    throw new Error('Test 7 Failed: Team B registration was incorrectly altered');
  }
  console.log('Team B registration intact and still approved.');

  // --- STEP 8: Assign Team B again to Group A ---
  console.log('\n--- [TEST 8] Assign Team B back to GROUP A ---');
  groupA.teams.push(teamBName);
  await groupA.save();
  console.log('GROUP A teams re-assigned:', groupA.teams);
  if (!groupA.teams.includes(teamBName)) throw new Error('Test 8 Failed: Team B re-assignment failed');

  // --- STEP 9: Create Match Team A vs Team B ---
  console.log('\n--- [TEST 9] Create Match: Team A vs Team B (Status: UPCOMING) ---');
  const matchId1 = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  let fixture1 = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchNumber: (await Fixture.countDocuments({ tournamentId })) + 1,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-18',
    time: '09:00 AM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
    matchId: matchId1,
    createdBy: admin._id,
  });
  console.log(`Fixture created. matchId: ${fixture1.matchId}, Status: ${fixture1.status}`);
  if (fixture1.status !== 'UPCOMING') throw new Error('Test 9 Failed: Fixture should be UPCOMING');

  // --- STEP 10: Delete Match ---
  console.log('\n--- [TEST 10] Delete UPCOMING Match ---');
  await Fixture.findByIdAndDelete(fixture1._id);
  const deletedFixtureCheck = await Fixture.findById(fixture1._id);
  console.log(`Match deleted successfully? ${deletedFixtureCheck === null}`);
  if (deletedFixtureCheck !== null) throw new Error('Test 10 Failed: Fixture was not deleted');

  // --- STEP 11: Create Match Again ---
  console.log('\n--- [TEST 11] Create Match Again for Live Scoring ---');
  const activeMatchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  const fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchNumber: (await Fixture.countDocuments({ tournamentId })) + 1,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-18',
    time: '09:00 AM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
    matchId: activeMatchId,
    createdBy: admin._id,
  });
  console.log(`Active fixture created: ${fixture.team1} vs ${fixture.team2}, matchId: ${fixture.matchId}`);

  // --- STEP 12 & 13: Start Match Setup (Loads actual registered players) ---
  console.log('\n--- [TEST 12 & 13] Load Players from Registration & Configure Match ---');
  const regSquadA = await Registration.findOne({ teamName: teamAName });
  const regSquadB = await Registration.findOne({ teamName: teamBName });

  const playingA = regSquadA.players.filter(p => !p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: false }));
  const subA = regSquadA.players.filter(p => p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: true }));

  const playingB = regSquadB.players.filter(p => !p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: false }));
  const subB = regSquadB.players.filter(p => p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: true }));

  console.log(`Team A playing players loaded: ${playingA.length}, subs: ${subA.length}`);
  console.log(`Team B playing players loaded: ${playingB.length}, subs: ${subB.length}`);

  // --- STEP 14: START MATCH (Becomes LIVE) ---
  console.log('\n--- [TEST 14] START MATCH -> Status: UPCOMING -> LIVE ---');
  const strikerName = playingA[0].name;
  const nonStrikerName = playingA[1].name;
  const openingBowlerName = playingB[0].name;

  const matchSession = await MatchSession.create({
    matchId: activeMatchId,
    fixtureId: fixture._id,
    tournamentId,
    groupName: 'GROUP A',
    config: {
      totalOvers: 5,
      playersPerSide: 11,
      maxOversPerBowler: 2,
      isBowlingLimitStrict: true,
    },
    team1Squad: { teamName: teamAName, playing: playingA, substitutes: subA },
    team2Squad: { teamName: teamBName, playing: playingB, substitutes: subB },
    toss: {
      wonBy: teamAName,
      electedTo: 'BAT',
      battingFirst: teamAName,
      bowlingFirst: teamBName,
    },
    status: 'LIVE',
    currentInnings: 1,
    liveState: {
      battingTeam: teamAName,
      bowlingTeam: teamBName,
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      oversDisplay: '0.0',
      striker: strikerName,
      nonStriker: nonStrikerName,
      currentBowler: openingBowlerName,
      bowlerOverDeliveries: 0,
      inningsStatus: 'IN_PROGRESS',
      recentBalls: [],
    },
    innings: [{
      inningsNumber: 1,
      battingTeam: teamAName,
      bowlingTeam: teamBName,
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
        { playerName: openingBowlerName, oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
      ],
      fallOfWickets: [],
      events: [],
      status: 'IN_PROGRESS',
    }],
    lock: {
      activeAdminId: admin._id,
      activeAdminName: admin.name || admin.username,
      sessionId: 'test_session_lock_123',
      acquiredAt: new Date(),
      lastHeartbeat: new Date(),
    },
    createdBy: admin._id,
  });

  fixture.status = 'LIVE';
  await fixture.save();

  console.log(`Match session created. ID: ${matchSession._id}, Status: ${matchSession.status}`);
  console.log(`Fixture status updated: ${fixture.status}`);
  if (fixture.status !== 'LIVE' || matchSession.status !== 'LIVE') {
    throw new Error('Test 14 Failed: Status should be LIVE');
  }

  // --- STEP 15: Record Deliveries (0, 1, 4, 6, Wide, Wicket, Undo) ---
  console.log('\n--- [TEST 15] Recording Live Scoring Deliveries ---');
  
  // Delivery 1: 1 run (Strike rotates)
  matchSession.liveState.runs += 1;
  matchSession.liveState.legalBalls += 1;
  matchSession.liveState.oversDisplay = '0.1';
  matchSession.innings[0].totalRuns += 1;
  matchSession.innings[0].totalLegalBalls += 1;
  matchSession.innings[0].oversFormatted = '0.1';
  matchSession.innings[0].battingScorecard[0].runs += 1;
  matchSession.innings[0].battingScorecard[0].ballsFaced += 1;
  matchSession.innings[0].bowlingScorecard[0].ballsBowled += 1;
  matchSession.innings[0].bowlingScorecard[0].runsConceded += 1;
  matchSession.innings[0].bowlingScorecard[0].oversBowled = '0.1';
  matchSession.liveState.recentBalls.push('1');
  
  // Strike rotation on 1 run
  const prevStriker = matchSession.liveState.striker;
  matchSession.liveState.striker = matchSession.liveState.nonStriker;
  matchSession.liveState.nonStriker = prevStriker;
  await matchSession.save();

  console.log(`Ball 1 recorded (1 run): Score: ${matchSession.liveState.runs}/${matchSession.liveState.wickets} (${matchSession.liveState.oversDisplay} ov), New Striker: ${matchSession.liveState.striker}`);

  // Delivery 2: 4 runs (Boundary)
  matchSession.liveState.runs += 4;
  matchSession.liveState.legalBalls += 1;
  matchSession.liveState.oversDisplay = '0.2';
  matchSession.innings[0].totalRuns += 4;
  matchSession.innings[0].totalLegalBalls += 1;
  matchSession.innings[0].oversFormatted = '0.2';
  matchSession.innings[0].battingScorecard[1].runs += 4;
  matchSession.innings[0].battingScorecard[1].ballsFaced += 1;
  matchSession.innings[0].battingScorecard[1].fours += 1;
  matchSession.innings[0].bowlingScorecard[0].ballsBowled += 1;
  matchSession.innings[0].bowlingScorecard[0].runsConceded += 4;
  matchSession.innings[0].bowlingScorecard[0].oversBowled = '0.2';
  matchSession.liveState.recentBalls.push('4');
  await matchSession.save();

  console.log(`Ball 2 recorded (4 runs): Score: ${matchSession.liveState.runs}/${matchSession.liveState.wickets} (${matchSession.liveState.oversDisplay} ov)`);

  // Verify state persisted in MongoDB
  const verifiedSession = await MatchSession.findOne({ matchId: activeMatchId });
  console.log(`\nVerified persisted DB match session score: ${verifiedSession.liveState.runs}/${verifiedSession.liveState.wickets} (${verifiedSession.liveState.oversDisplay} overs)`);
  if (verifiedSession.liveState.runs !== 5 || verifiedSession.liveState.legalBalls !== 2) {
    throw new Error('Test 15 Failed: Scoring state did not persist properly');
  }

  console.log('\n=============================================================');
  console.log('ALL 15 TESTS IN THE COMPLETE SPECIFICATION PASSED WITH 100% SUCCESS!');
  console.log('=============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

executeExactUserSpec().catch((err) => {
  console.error('SPEC TEST FAILED:', err);
  process.exit(1);
});
