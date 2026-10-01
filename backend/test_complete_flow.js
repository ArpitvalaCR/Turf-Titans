import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import MatchSession from './src/models/matchSession.model.js';
import User from './src/models/user.model.js';
import {
  createRegistration,
  verifyPayment,
  approveRegistration,
} from './src/services/registration.service.js';

async function runEndToEndTest() {
  console.log('--- Starting End-to-End Tournament Lifecycle Test ---');
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'turf_titans' });
  console.log('Connected to MongoDB.');

  // Find or create an admin user
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      username: 'testadmin',
      email: 'admin@turftitans.com',
      password: 'Password123!',
      role: 'admin',
    });
    console.log('Created test admin user.');
  }

  const tournamentId = 'turf-titans-2025';
  const team1Name = `Apex Strikers ${Date.now().toString().slice(-4)}`;
  const team2Name = `Vortex Warriors ${Date.now().toString().slice(-4)}`;

  // 1. Submit Registration 1 (11 playing + 1 sub)
  console.log('\n[1] Submitting Team 1 Registration (11 Playing + 1 Sub)...');
  const team1Players = [
    { name: 'Rohit Sharma (C)', role: 'Batsman', isCaptain: true, isSubstitute: false },
    { name: 'Virat Kohli', role: 'Batsman', isSubstitute: false },
    { name: 'Hardik Pandya', role: 'All-Rounder', isSubstitute: false },
    { name: 'Rishabh Pant (WK)', role: 'Wicketkeeper', isSubstitute: false },
    { name: 'Suryakumar Yadav', role: 'Batsman', isSubstitute: false },
    { name: 'Ravindra Jadeja', role: 'All-Rounder', isSubstitute: false },
    { name: 'Axar Patel', role: 'All-Rounder', isSubstitute: false },
    { name: 'Jasprit Bumrah', role: 'Bowler', isSubstitute: false },
    { name: 'Mohammed Shami', role: 'Bowler', isSubstitute: false },
    { name: 'Kuldeep Yadav', role: 'Bowler', isSubstitute: false },
    { name: 'Arshdeep Singh', role: 'Bowler', isSubstitute: false },
    { name: 'Sanju Samson (Sub)', role: 'Batsman', isSubstitute: true }, // Sub
  ];

  const reg1 = await createRegistration({
    registrationId: `TT-2025-REG-${Math.floor(1000 + Math.random() * 9000)}`,
    teamName: team1Name,
    captainName: 'Rohit Sharma',
    captainEmail: 'rohit@example.com',
    captainPhone: '+91 98200 11111',
    whatsappNumber: '+91 98200 11111',
    sport: 'cricket',
    transactionId: `UTR${Date.now()}01`,
    paymentAmount: 3000,
    players: team1Players,
  });
  console.log(`Team 1 submitted. ID: ${reg1.registrationId}, Status: ${reg1.registrationStatus}, Payment: ${reg1.paymentStatus}, Total Players: ${reg1.playerCount}`);

  // 2. Submit Registration 2
  console.log('\n[2] Submitting Team 2 Registration (11 Playing + 1 Sub)...');
  const team2Players = [
    { name: 'Pat Cummins (C)', role: 'Bowler', isCaptain: true, isSubstitute: false },
    { name: 'Travis Head', role: 'Batsman', isSubstitute: false },
    { name: 'David Warner', role: 'Batsman', isSubstitute: false },
    { name: 'Steve Smith', role: 'Batsman', isSubstitute: false },
    { name: 'Glenn Maxwell', role: 'All-Rounder', isSubstitute: false },
    { name: 'Marcus Stoinis', role: 'All-Rounder', isSubstitute: false },
    { name: 'Josh Inglis (WK)', role: 'Wicketkeeper', isSubstitute: false },
    { name: 'Mitchell Starc', role: 'Bowler', isSubstitute: false },
    { name: 'Josh Hazlewood', role: 'Bowler', isSubstitute: false },
    { name: 'Adam Zampa', role: 'Bowler', isSubstitute: false },
    { name: 'Nathan Ellis', role: 'Bowler', isSubstitute: false },
    { name: 'Cameron Green (Sub)', role: 'All-Rounder', isSubstitute: true }, // Sub
  ];

  const reg2 = await createRegistration({
    registrationId: `TT-2025-REG-${Math.floor(1000 + Math.random() * 9000)}`,
    teamName: team2Name,
    captainName: 'Pat Cummins',
    captainEmail: 'pat@example.com',
    captainPhone: '+91 98200 22222',
    whatsappNumber: '+91 98200 22222',
    sport: 'cricket',
    transactionId: `UTR${Date.now()}02`,
    paymentAmount: 3000,
    players: team2Players,
  });
  console.log(`Team 2 submitted. ID: ${reg2.registrationId}, Status: ${reg2.registrationStatus}`);

  // 3. Admin Verifies Payment and Approves Registration for both teams
  console.log('\n[3] Admin Verifying Payment & Approving Team 1...');
  await verifyPayment(reg1._id, admin._id);
  const approvedReg1 = await approveRegistration(reg1._id, admin._id);
  console.log(`Team 1 approved. Registration Status: ${approvedReg1.registrationStatus}, Payment: ${approvedReg1.paymentStatus}`);

  console.log('\n[4] Admin Approving Team 2...');
  const approvedReg2 = await approveRegistration(reg2._id, admin._id);
  console.log(`Team 2 approved. Registration Status: ${approvedReg2.registrationStatus}`);

  // 4. Assign Approved Teams to Group A
  console.log('\n[5] Assigning Approved Teams to GROUP A...');
  const group = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { teams: [team1Name, team2Name] },
    { returnDocument: 'after', upsert: true }
  );
  console.log(`GROUP A teams updated: ${JSON.stringify(group.teams)}`);

  // 5. Create Fixture between Group A teams
  console.log('\n[6] Creating Fixture in GROUP A...');
  const fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    team1: team1Name,
    team2: team2Name,
    date: '2025-10-12',
    time: '08:00 PM',
    ground: 'Centre Arena',
    status: 'UPCOMING',
  });
  console.log(`Fixture created. ID: ${fixture._id}, matchId: ${fixture.matchId}, ${fixture.team1} vs ${fixture.team2}`);

  // 6. Verify MatchSession initialization
  console.log('\n[7] Initializing MatchSession for scoring...');
  const session = await MatchSession.create({
    matchId: fixture.matchId,
    fixtureId: fixture._id,
    tournamentId,
    groupName: 'GROUP A',
    config: {
      totalOvers: 5,
      playersPerSide: 7,
      maxOversPerBowler: 1,
      isBowlingLimitStrict: true,
    },
    team1Squad: {
      teamName: team1Name,
      playing: team1Players.filter(p => !p.isSubstitute),
      substitutes: team1Players.filter(p => p.isSubstitute),
    },
    team2Squad: {
      teamName: team2Name,
      playing: team2Players.filter(p => !p.isSubstitute),
      substitutes: team2Players.filter(p => p.isSubstitute),
    },
    toss: {
      wonBy: team1Name,
      electedTo: 'BAT',
      battingFirst: team1Name,
      bowlingFirst: team2Name,
    },
    status: 'LIVE',
    currentInnings: 1,
    target: 0,
    liveState: {
      battingTeam: team1Name,
      bowlingTeam: team2Name,
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      oversDisplay: '0.0',
      striker: team1Players[0].name,
      nonStriker: team1Players[1].name,
      currentBowler: team2Players[0].name,
      bowlerOverDeliveries: 0,
      inningsStatus: 'IN_PROGRESS',
      recentBalls: [],
    },
    innings: [
      {
        inningsNumber: 1,
        battingTeam: team1Name,
        bowlingTeam: team2Name,
        totalRuns: 0,
        totalWickets: 0,
        totalLegalBalls: 0,
        oversFormatted: '0.0',
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
        battingScorecard: [
          { playerName: team1Players[0].name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
          { playerName: team1Players[1].name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
        ],
        bowlingScorecard: [
          { playerName: team2Players[0].name, oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
        ],
        fallOfWickets: [],
        events: [],
        status: 'IN_PROGRESS',
      },
    ],
    lock: {
      activeAdminId: admin._id,
      activeAdminName: 'Test Admin',
      sessionId: 'test-session-123',
      acquiredAt: new Date(),
      lastHeartbeat: new Date(),
    },
  });
  console.log(`MatchSession initialized: ${session.matchId}, Batting: ${session.liveState.battingTeam}, Striker: ${session.liveState.striker}`);

  console.log('\n=== ALL END-TO-END FLOW TESTS PASSED SUCCESSFULLY! ===');
  await mongoose.disconnect();
}

runEndToEndTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
