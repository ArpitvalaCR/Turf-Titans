import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/db/config.js';
import app from './src/app.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import Registration from './src/models/registration.model.js';
import { oversToBalls, ballsToOversStr, calculateTournamentPointsTable } from './src/services/pointsTable.service.js';

dotenv.config({ path: './.env' });

const TOURNAMENT_ID = new mongoose.Types.ObjectId().toString();

async function runPointsTableTests() {
  console.log('\n--- STARTING POINTS TABLE AUTOMATED SUITE ---');
  let passed = 0;
  let failed = 0;
  let server;
  let BASE_URL;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await connectDB();
    console.log('MongoDB connected for testing.');

    server = app.listen(0);
    const port = server.address().port;
    BASE_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running on port ${port}`);


    // 1. Test Cricket Overs to Balls conversions
    console.log('\n[1. Testing Cricket Overs Conversion]');
    assert(oversToBalls('4.2') === 26, 'oversToBalls("4.2") is 26 balls (4*6 + 2)');
    assert(oversToBalls('5.0') === 30, 'oversToBalls("5.0") is 30 balls (5*6)');
    assert(oversToBalls('0.5') === 5, 'oversToBalls("0.5") is 5 balls');
    assert(oversToBalls(null) === 0, 'oversToBalls(null) is 0 balls');
    assert(ballsToOversStr(26) === '4.2', 'ballsToOversStr(26) is "4.2"');
    assert(ballsToOversStr(30) === '5.0', 'ballsToOversStr(30) is "5.0"');

    // 2. Setup test registered teams and groups
    console.log('\n[2. Setting Up Test Groups & Registered Teams]');
    const testRegs = await Registration.insertMany([
      {
        eventId: TOURNAMENT_ID,
        teamName: 'PT Team Alpha',
        captainName: 'Captain A',
        captainEmail: 'alpha@example.com',
        captainPhone: '9999999991',
        sport: 'cricket',
      },
      {
        eventId: TOURNAMENT_ID,
        teamName: 'PT Team Beta',
        captainName: 'Captain B',
        captainEmail: 'beta@example.com',
        captainPhone: '9999999992',
        sport: 'cricket',
      },
      {
        eventId: TOURNAMENT_ID,
        teamName: 'PT Team Gamma',
        captainName: 'Captain C',
        captainEmail: 'gamma@example.com',
        captainPhone: '9999999993',
        sport: 'cricket',
      },
      {
        eventId: TOURNAMENT_ID,
        teamName: 'PT Team Delta',
        captainName: 'Captain D',
        captainEmail: 'delta@example.com',
        captainPhone: '9999999994',
        sport: 'cricket',
      },
    ]);

    await TournamentGroup.create([
      {
        tournamentId: TOURNAMENT_ID,
        groupName: 'GROUP A',
        teams: ['PT Team Alpha', 'PT Team Beta'],
      },
      {
        tournamentId: TOURNAMENT_ID,
        groupName: 'GROUP B',
        teams: ['PT Team Gamma', 'PT Team Delta'],
      },
    ]);

    // 3. Test Initial Points Table (Zero Completed Matches)
    console.log('\n[3. Testing Zero State / No Mock Data]');
    const ptResponse = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/points-table`);
    const ptText = await ptResponse.text();
    console.log('ptResponse status:', ptResponse.status, 'body:', ptText);
    let ptJson;
    try {
      ptJson = JSON.parse(ptText);
    } catch {
      ptJson = {};
    }

    assert(ptResponse.status === 200, 'GET points-table returned HTTP 200');
    assert(Array.isArray(ptJson.data), 'Points table returns an array of groups');
    if (!ptJson.data) throw new Error('ptJson.data is undefined: ' + ptText);
    assert(ptJson.data.length === 2, 'Returns exactly 2 groups');

    const grpA = ptJson.data.find((g) => g.groupName === 'GROUP A');
    assert(grpA !== undefined, 'GROUP A exists in points table');
    assert(grpA.standings.length === 2, 'GROUP A contains both assigned teams');

    const alphaStanding = grpA.standings.find((s) => s.team === 'PT Team Alpha');
    assert(alphaStanding.played === 0, 'Alpha played is 0');
    assert(alphaStanding.won === 0, 'Alpha won is 0');
    assert(alphaStanding.lost === 0, 'Alpha lost is 0');
    assert(alphaStanding.tied === 0, 'Alpha tied is 0');
    assert(alphaStanding.points === 0, 'Alpha points is 0');
    assert(alphaStanding.nrr === '+0.000', 'Alpha initial NRR is +0.000');

    // 4. Test Auto Calculation on Completed Match
    console.log('\n[4. Testing Scoring Result Integration & NRR Calculation]');
    // Simulate a completed match: Alpha vs Beta
    // Alpha scores 60 runs in 5.0 overs (30 balls -> 5 overs) = 12.000 run rate
    // Beta scores 45 runs in 5.0 overs (30 balls -> 5 overs) = 9.000 run rate
    // Expected Alpha NRR: 12.000 - 9.000 = +3.000, Points = 2, Won = 1, Lost = 0
    // Expected Beta NRR: 9.000 - 12.000 = -3.000, Points = 0, Won = 0, Lost = 1
    const testFixture = await Fixture.create({
      tournamentId: TOURNAMENT_ID,
      groupName: 'GROUP A',
      team1: 'PT Team Alpha',
      team2: 'PT Team Beta',
      date: '2026-09-20',
      time: '10:00 AM',
      ground: 'Pitch 1',
      status: 'COMPLETED',
      score: {
        team1Runs: 60,
        team1Wickets: 2,
        team1Overs: '5.0',
        team2Runs: 45,
        team2Wickets: 4,
        team2Overs: '5.0',
      },
      result: 'PT Team Alpha won by 15 runs',
      matchId: 'test-match-01',
    });

    const updatedPtRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/points-table`);
    const updatedPtJson = await updatedPtRes.json();
    const updatedGrpA = updatedPtJson.data.find((g) => g.groupName === 'GROUP A');

    const updatedAlpha = updatedGrpA.standings.find((s) => s.team === 'PT Team Alpha');
    const updatedBeta = updatedGrpA.standings.find((s) => s.team === 'PT Team Beta');

    assert(updatedAlpha.played === 1, 'Alpha played is 1 after match completion');
    assert(updatedAlpha.won === 1, 'Alpha won is 1');
    assert(updatedAlpha.lost === 0, 'Alpha lost is 0');
    assert(updatedAlpha.points === 2, 'Alpha points is 2 for win');
    assert(updatedAlpha.nrr === '+3.000', `Alpha NRR correctly calculated: ${updatedAlpha.nrr} (expected +3.000)`);

    assert(updatedBeta.played === 1, 'Beta played is 1');
    assert(updatedBeta.won === 0, 'Beta won is 0');
    assert(updatedBeta.lost === 1, 'Beta lost is 1');
    assert(updatedBeta.points === 0, 'Beta points is 0 for loss');
    assert(updatedBeta.nrr === '-3.000', `Beta NRR correctly calculated: ${updatedBeta.nrr} (expected -3.000)`);

    // Verify ordering in standings (Alpha should be ranked 1st)
    assert(updatedGrpA.standings[0].team === 'PT Team Alpha', 'Alpha ranks #1 in Group A');
    assert(updatedGrpA.standings[1].team === 'PT Team Beta', 'Beta ranks #2 in Group A');

    // 4b. Test Multi-Match Cumulative NRR calculation (User specified example)
    console.log('\n[4b. Testing Multi-Match Cumulative NRR]');
    // Create a 3rd team in Group A: Gamma
    await TournamentGroup.updateOne(
      { tournamentId: TOURNAMENT_ID, groupName: 'GROUP A' },
      { $set: { teams: ['PT Team Alpha', 'PT Team Beta', 'PT Team Gamma'] } }
    );

    // Alpha played Match 1 above (scores 60 in 5.0 ov, Beta scores 45 in 5.0 ov)
    // Delete previous test fixtures and simulate exact user scenario:
    await Fixture.deleteMany({ tournamentId: TOURNAMENT_ID });

    // Match 1: Alpha 50 (5.0 ov) vs Beta 40 (5.0 ov)
    await Fixture.create({
      tournamentId: TOURNAMENT_ID,
      groupName: 'GROUP A',
      team1: 'PT Team Alpha',
      team2: 'PT Team Beta',
      date: '2026-09-20',
      time: '10:00 AM',
      ground: 'Pitch 1',
      status: 'COMPLETED',
      score: {
        team1Runs: 50,
        team1Wickets: 2,
        team1Overs: '5.0',
        team2Runs: 40,
        team2Wickets: 4,
        team2Overs: '5.0',
      },
      result: 'PT Team Alpha won by 10 runs',
      matchId: 'test-match-cum-1',
    });

    // Match 2: Alpha 45 (5.0 ov) vs Gamma 48 (5.0 ov)
    await Fixture.create({
      tournamentId: TOURNAMENT_ID,
      groupName: 'GROUP A',
      team1: 'PT Team Alpha',
      team2: 'PT Team Gamma',
      date: '2026-09-20',
      time: '11:00 AM',
      ground: 'Pitch 1',
      status: 'COMPLETED',
      score: {
        team1Runs: 45,
        team1Wickets: 3,
        team1Overs: '5.0',
        team2Runs: 48,
        team2Wickets: 2,
        team2Overs: '5.0',
      },
      result: 'PT Team Gamma won by 3 runs',
      matchId: 'test-match-cum-2',
    });

    // Cumulative Alpha: Runs Scored = 95, Overs Faced = 10, Runs Conceded = 88, Overs Bowled = 10
    // NRR = (95/10) - (88/10) = 9.5 - 8.8 = +0.700
    const cumPtRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/points-table`);
    const cumPtJson = await cumPtRes.json();
    const cumGrpA = cumPtJson.data.find((g) => g.groupName === 'GROUP A');
    const cumAlpha = cumGrpA.standings.find((s) => s.team === 'PT Team Alpha');

    assert(cumAlpha.played === 2, 'Alpha played is 2 matches');
    assert(cumAlpha.runsScored === 95, 'Cumulative runs scored is 95');
    assert(cumAlpha.runsConceded === 88, 'Cumulative runs conceded is 88');
    assert(cumAlpha.nrr === '+0.700', `Cumulative NRR correctly calculated: ${cumAlpha.nrr} (expected +0.700)`);

    // 5. Cleanup test data
    console.log('\n[5. Cleaning Up Test Data]');
    await Registration.deleteMany({ eventId: TOURNAMENT_ID });
    await TournamentGroup.deleteMany({ tournamentId: TOURNAMENT_ID });
    await Fixture.deleteMany({ tournamentId: TOURNAMENT_ID });
    console.log('Test tournament data purged.');

  } catch (err) {
    console.error('Error during test execution:', err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log(`\n========================================`);
    console.log(`POINTS TABLE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPointsTableTests();

