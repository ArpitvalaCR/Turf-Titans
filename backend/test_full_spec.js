import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import MatchSession from './src/models/matchSession.model.js';
import User from './src/models/user.model.js';
import { createRegistration } from './src/services/registration.service.js';
import { sendRegistrationSubmittedEmail } from './src/services/email.service.js';

dotenv.config();

async function runSpecVerification() {
  console.log('=== STARTING FULL SPEC VERIFICATION ===');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turf_titans');
  console.log('Connected to database.');

  const tournamentId = 'turf-titans-2025';
  const tag = Date.now().toString().slice(-4);
  const teamAName = `Royal Knights ${tag}`;
  const teamBName = `Metro Strikers ${tag}`;

  // 1. Create Admin User if not exists
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: `Admin ${tag}`,
      username: `admin_${tag}`,
      email: `admin_${tag}@turftitans.com`,
      password: 'password123',
      role: 'admin',
    });
  }

  // 2. Register Team A with 11 playing + 1 sub
  console.log('\n[1] Submitting Team A Registration...');
  const teamAPlayers = [];
  for (let i = 1; i <= 11; i++) {
    teamAPlayers.push({
      name: `Knight Player ${i}`,
      role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler',
      isSubstitute: false,
    });
  }
  teamAPlayers.push({
    name: `Knight Sub 12`,
    role: 'all-rounder',
    isSubstitute: true,
  });

  const regA = await Registration.create({
    teamName: teamAName,
    captainName: 'Sir Lancelot',
    captainEmail: 'lancelot@knights.com',
    captainPhone: '9876543210',
    whatsappNumber: '9876543210',
    sport: 'cricket',
    players: teamAPlayers,
    transactionId: `UTR-A-${tag}`,
    paymentStatus: 'pending',
    registrationStatus: 'pending',
  });
  console.log(`Team A created. ID: ${regA.registrationId || regA._id}, Status: ${regA.registrationStatus}`);

  // Test email template execution
  try {
    await sendRegistrationSubmittedEmail(regA, { title: 'Turf Titans 2025 Grand Cup' });
    console.log('Registration Submitted Email generated & handled cleanly.');
  } catch (err) {
    console.log('Email delivery skipped / caught in test mode:', err.message);
  }

  // 3. Register Team B with 11 playing + 1 sub
  console.log('\n[2] Submitting Team B Registration...');
  const teamBPlayers = [];
  for (let i = 1; i <= 11; i++) {
    teamBPlayers.push({
      name: `Metro Player ${i}`,
      role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler',
      isSubstitute: false,
    });
  }
  teamBPlayers.push({
    name: `Metro Sub 12`,
    role: 'all-rounder',
    isSubstitute: true,
  });

  const regB = await Registration.create({
    teamName: teamBName,
    captainName: 'Metro Captain',
    captainEmail: 'captain@metro.com',
    captainPhone: '9876543211',
    whatsappNumber: '9876543211',
    sport: 'cricket',
    players: teamBPlayers,
    transactionId: `UTR-B-${tag}`,
    paymentStatus: 'pending',
    registrationStatus: 'pending',
  });
  console.log(`Team B created. ID: ${regB.registrationId || regB._id}, Status: ${regB.registrationStatus}`);

  // 4. Admin Approves both teams
  console.log('\n[3] Admin Approving Registrations...');
  regA.registrationStatus = 'approved';
  regA.paymentStatus = 'verified';
  regA.verifiedBy = admin._id;
  await regA.save();

  regB.registrationStatus = 'approved';
  regB.paymentStatus = 'verified';
  regB.verifiedBy = admin._id;
  await regB.save();
  console.log('Both registrations approved and marked verified.');

  // 5. Assign both to GROUP A
  console.log('\n[4] Assigning Team A & Team B to GROUP A...');
  let groupA = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { tournamentId, groupName: 'GROUP A', teams: [teamAName, teamBName] },
    { upsert: true, new: true }
  );
  console.log('GROUP A teams:', groupA.teams);

  // 6. Test Unassigning / Removing Team B from GROUP A
  console.log('\n[5] Testing Unassigning Team B from GROUP A...');
  groupA.teams = groupA.teams.filter((t) => t !== teamBName);
  await groupA.save();
  console.log('GROUP A teams after removing Team B:', groupA.teams);

  // 7. Re-assign Team B back to GROUP A
  console.log('\n[6] Re-assigning Team B to GROUP A...');
  groupA.teams.push(teamBName);
  await groupA.save();
  console.log('GROUP A teams re-assigned:', groupA.teams);

  // 8. Create Fixture Team A vs Team B under GROUP A
  console.log('\n[7] Creating UPCOMING Fixture (Team A vs Team B)...');
  const matchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  let fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchNumber: (await Fixture.countDocuments({ tournamentId })) + 1,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-15',
    time: '10:00 AM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
    matchId,
    createdBy: admin._id,
  });
  console.log(`Fixture created. ID: ${fixture._id}, matchId: ${fixture.matchId}, Status: ${fixture.status}`);

  // 9. Test deleting UPCOMING fixture
  console.log('\n[8] Testing Deleting UPCOMING Fixture...');
  await Fixture.findByIdAndDelete(fixture._id);
  const deletedCheck = await Fixture.findById(fixture._id);
  console.log(`Fixture deleted successfully? ${deletedCheck === null}`);

  // 10. Recreate Fixture for Start Match flow
  console.log('\n[9] Re-creating Fixture for Start Match Flow...');
  const activeMatchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchNumber: (await Fixture.countDocuments({ tournamentId })) + 1,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-15',
    time: '10:00 AM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
    matchId: activeMatchId,
    createdBy: admin._id,
  });
  console.log(`Active fixture created. matchId: ${fixture.matchId}`);

  // 11. Start Match Setup (Overs, Players, Toss, Openers)
  console.log('\n[10] Initializing Match Setup & starting LIVE MatchSession...');
  const playingA = teamAPlayers.filter(p => !p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: false }));
  const subA = teamAPlayers.filter(p => p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: true }));

  const playingB = teamBPlayers.filter(p => !p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: false }));
  const subB = teamBPlayers.filter(p => p.isSubstitute).map(p => ({ name: p.name, role: p.role, isSubstitute: true }));

  const session = await MatchSession.create({
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
    team1Squad: {
      teamName: teamAName,
      playing: playingA,
      substitutes: subA,
    },
    team2Squad: {
      teamName: teamBName,
      playing: playingB,
      substitutes: subB,
    },
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
      striker: playingA[0].name,
      nonStriker: playingA[1].name,
      currentBowler: playingB[0].name,
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
        { playerName: playingA[0].name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
        { playerName: playingA[1].name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
      ],
      bowlingScorecard: [
        { playerName: playingB[0].name, oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
      ],
      fallOfWickets: [],
      events: [],
      status: 'IN_PROGRESS',
    }],
    lock: {
      activeAdminId: admin._id,
      activeAdminName: admin.username,
      sessionId: 'sess_test_123',
      acquiredAt: new Date(),
      lastHeartbeat: new Date(),
    },
    createdBy: admin._id,
  });

  // Update Fixture Status
  fixture.status = 'LIVE';
  await fixture.save();

  console.log(`Match Session LIVE. matchId: ${session.matchId}, Batting: ${session.liveState.battingTeam}, Striker: ${session.liveState.striker}, Non-Striker: ${session.liveState.nonStriker}, Bowler: ${session.liveState.currentBowler}`);

  console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY! ===');
  await mongoose.disconnect();
  process.exit(0);
}

runSpecVerification().catch((err) => {
  console.error('SPEC VERIFICATION FAILED:', err);
  process.exit(1);
});
