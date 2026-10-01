import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/db/config.js';
import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';

dotenv.config();

async function testRealHttpFlow() {
  console.log('===========================================================');
  console.log('TESTING REAL HTTP REQUESTS OVER NETWORK (PORT 8000)');
  console.log('===========================================================');

  await connectDB();
  console.log('Connected to MongoDB via connectDB.');

  const tournamentId = 'turf-titans-2025';
  const tag = Date.now().toString().slice(-4);
  const teamAName = `Live Team A ${tag}`;
  const teamBName = `Live Team B ${tag}`;

  // 1. Authenticate with the live running server
  const adminEmail = process.env.ADMIN_EMAIL || 'valanikki06@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status, 'Success:', loginData.success);
  if (!loginData.success || !loginData.data?.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.accessToken;
  console.log('Obtained authentic live server JWT token for HTTP requests.');

  // 2. Register and approve Team A and Team B
  const makePlayers = (prefix) => {
    const list = [];
    for (let i = 1; i <= 11; i++) {
      list.push({ name: `${prefix} Player ${i}`, role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler', isSubstitute: false });
    }
    list.push({ name: `${prefix} Sub 12`, role: 'all-rounder', isSubstitute: true });
    return list;
  };

  const regA = await Registration.create({
    teamName: teamAName,
    captainName: 'Captain A',
    captainEmail: `cap.a.${tag}@live.com`,
    captainPhone: '9876543210',
    sport: 'cricket',
    players: makePlayers('LiveA'),
    registrationStatus: 'approved',
    paymentStatus: 'verified',
  });

  const regB = await Registration.create({
    teamName: teamBName,
    captainName: 'Captain B',
    captainEmail: `cap.b.${tag}@live.com`,
    captainPhone: '9876543211',
    sport: 'cricket',
    players: makePlayers('LiveB'),
    registrationStatus: 'approved',
    paymentStatus: 'verified',
  });

  // Assign both to Group A initially
  await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { $addToSet: { teams: { $each: [teamAName, teamBName] } } },
    { upsert: true }
  );

  console.log(`Pre-seeded teams in MongoDB: ${teamAName}, ${teamBName} in GROUP A.`);

  // -------------------------------------------------------------
  // TEST ACTION 1: HTTP DELETE REMOVE TEAM FROM GROUP
  // -------------------------------------------------------------
  console.log('\n--- [TEST 1: REMOVE TEAM FROM GROUP VIA HTTP] ---');
  const removeUrl = `http://localhost:8000/api/v1/tournaments/${tournamentId}/groups/GROUP%20A/teams/${encodeURIComponent(teamBName)}`;
  console.log(`Sending HTTP DELETE to: ${removeUrl}`);

  const removeRes = await fetch(removeUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`HTTP Status: ${removeRes.status}`);
  const removeData = await removeRes.json();
  console.log('Response Payload:', removeData);

  if (removeRes.status !== 200 || !removeData.success) {
    throw new Error(`Remove team HTTP request failed with status ${removeRes.status}: ${JSON.stringify(removeData)}`);
  }

  // Verify MongoDB
  const groupAfterRemove = await TournamentGroup.findOne({ tournamentId, groupName: 'GROUP A' });
  console.log('Verified Group A teams in MongoDB:', groupAfterRemove.teams);
  if (groupAfterRemove.teams.includes(teamBName)) {
    throw new Error('Database still contains removed team');
  }

  // Re-add teamB for Match creation
  await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { $addToSet: { teams: teamBName } }
  );

  // -------------------------------------------------------------
  // TEST ACTION 2: HTTP START MATCH & MATCH SETUP
  // -------------------------------------------------------------
  console.log('\n--- [TEST 2: START MATCH & SETUP VIA HTTP] ---');
  const matchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  
  const fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchId,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-15',
    time: '02:00 PM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
  });

  console.log(`Created fixture: ${fixture.team1} vs ${fixture.team2} (matchId: ${matchId})`);

  // Step 2a: GET Match Session metadata before setup
  const sessionUrl = `http://localhost:8000/api/v1/matches/${matchId}/session`;
  console.log(`Sending HTTP GET to: ${sessionUrl}`);
  const getSessionRes = await fetch(sessionUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  console.log(`HTTP Status: ${getSessionRes.status}`);
  const sessionData = await getSessionRes.json();
  console.log(`Match Metadata: isConfigured=${sessionData.data.isConfigured}, Team1 Players=${sessionData.data.team1AvailablePlayers?.length}, Team2 Players=${sessionData.data.team2AvailablePlayers?.length}`);

  if (getSessionRes.status !== 200 || !sessionData.success || sessionData.data.team1AvailablePlayers?.length !== 12) {
    throw new Error('Failed to fetch fixture registered squad players');
  }

  // Step 2b: POST Match Setup
  const setupUrl = `http://localhost:8000/api/v1/matches/${matchId}/setup`;
  console.log(`Sending HTTP POST to: ${setupUrl}`);

  const setupPayload = {
    config: {
      totalOvers: 5,
      playersPerSide: 7,
      maxOversPerBowler: 1,
      isBowlingLimitStrict: true,
    },
    team1Squad: {
      teamName: teamAName,
      playing: regA.players.filter(p => !p.isSubstitute).slice(0, 7),
      substitutes: regA.players.filter(p => p.isSubstitute),
    },
    team2Squad: {
      teamName: teamBName,
      playing: regB.players.filter(p => !p.isSubstitute).slice(0, 7),
      substitutes: regB.players.filter(p => p.isSubstitute),
    },
    toss: {
      wonBy: teamAName,
      electedTo: 'BAT',
    },
    openers: {
      striker: 'LiveA Player 1',
      nonStriker: 'LiveA Player 2',
      openingBowler: 'LiveB Player 1',
    },
  };

  const setupRes = await fetch(setupUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(setupPayload),
  });

  console.log(`HTTP Status: ${setupRes.status}`);
  const setupData = await setupRes.json();
  console.log('Setup Response Message:', setupData.message);

  if (setupRes.status !== 200 || !setupData.success) {
    throw new Error(`Match setup HTTP request failed with status ${setupRes.status}: ${JSON.stringify(setupData)}`);
  }

  // Step 2c: Verify Fixture status is now LIVE in MongoDB
  const verifiedFixture = await Fixture.findOne({ matchId });
  console.log(`Verified Fixture status in MongoDB: ${verifiedFixture.status}`);
  if (verifiedFixture.status !== 'LIVE') {
    throw new Error('Fixture status did not update to LIVE');
  }

  // Step 2d: Record Ball 1 over HTTP
  const deliveryUrl = `http://localhost:8000/api/v1/matches/${matchId}/deliveries`;
  console.log(`Sending HTTP POST delivery to: ${deliveryUrl}`);

  const delivRes = await fetch(deliveryUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      runsOffBat: 1,
      extraType: 'NONE',
      additionalRanRuns: 0,
      isWicket: false,
    }),
  });

  console.log(`HTTP Status: ${delivRes.status}`);
  const delivData = await delivRes.json();
  console.log(`Delivery Recorded: Score is ${delivData.data.liveState.runs}/${delivData.data.liveState.wickets} in ${delivData.data.liveState.oversDisplay} overs, Striker: ${delivData.data.liveState.striker}`);

  if (delivRes.status !== 200 || !delivData.success || delivData.data.liveState.runs !== 1) {
    throw new Error('Recording delivery over HTTP failed');
  }

  console.log('\n===========================================================');
  console.log('ALL HTTP NETWORK ENDPOINTS PASSED WITH 100% SUCCESS!');
  console.log('===========================================================');

  await mongoose.disconnect();
  process.exit(0);
}

testRealHttpFlow().catch((err) => {
  console.error('HTTP FLOW TEST FAILED:', err);
  process.exit(1);
});
