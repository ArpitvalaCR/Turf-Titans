import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/db/config.js';
import app from './src/app.js';
import Registration from './src/models/registration.model.js';
import Fixture from './src/models/fixture.model.js';
import Score from './src/models/score.model.js';

dotenv.config({ path: './.env' });

const TOURNAMENT_ID = new mongoose.Types.ObjectId().toString();

async function runLeaderboardTests() {
  console.log('\n--- STARTING LEADERBOARD & MVP AUTOMATED SUITE ---');
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
    console.log(`Test server running on port ${port}`);

    // 1. Setup registered squads with players
    console.log('\n[1. Setting Up Test Teams & Registered Rosters]');
    await Registration.create([
      {
        eventId: TOURNAMENT_ID,
        teamName: 'LB Alpha Titans',
        captainName: 'Rohit Sharma',
        captainEmail: 'rohit@titans.com',
        captainPhone: '9876543210',
        sport: 'cricket',
        players: [
          { name: 'Rohit Sharma', jerseyNumber: '45', role: 'Batsman' },
          { name: 'Virat Kohli', jerseyNumber: '18', role: 'Batsman' },
          { name: 'Jasprit Bumrah', jerseyNumber: '93', role: 'Bowler' },
          { name: 'KL Rahul', jerseyNumber: '1', role: 'Wicket Keeper' },
        ],
      },
      {
        eventId: TOURNAMENT_ID,
        teamName: 'LB Beta Royals',
        captainName: 'Hardik Pandya',
        captainEmail: 'hardik@royals.com',
        captainPhone: '9876543211',
        sport: 'cricket',
        players: [
          { name: 'Hardik Pandya', jerseyNumber: '33', role: 'All-Rounder' },
          { name: 'Rashid Khan', jerseyNumber: '19', role: 'Bowler' },
          { name: 'Sanju Samson', jerseyNumber: '11', role: 'Wicket Keeper' },
        ],
      },
    ]);

    // 2. Test Initial State (Zero completed matches)
    console.log('\n[2. Testing Initial Leaderboard State]');
    const initRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=batting&statistic=top_run_scorer`);
    const initJson = await initRes.json();

    assert(initRes.status === 200, 'GET leaderboard returned HTTP 200');
    assert(initJson.data.category === 'batting', 'Category is batting');
    assert(Array.isArray(initJson.data.standings), 'Standings is an array');
    assert(initJson.data.standings.length === 7, 'All 7 registered players initialized in standings');
    assert(initJson.data.standings[0].value === 0, 'Initial top run value is 0 (no fake scores)');

    // 3. Simulate Completed Match with Player Performance Scorecards
    console.log('\n[3. Simulating Completed Match Scorecard Telemetry]');
    const matchId = `match-lb-${Date.now()}`;
    await Fixture.create({
      tournamentId: TOURNAMENT_ID,
      groupName: 'GROUP A',
      team1: 'LB Alpha Titans',
      team2: 'LB Beta Royals',
      date: '2026-09-22',
      time: '04:00 PM',
      ground: 'Pitch 1',
      status: 'COMPLETED',
      score: {
        team1Runs: 65,
        team1Wickets: 1,
        team1Overs: '5.0',
        team2Runs: 50,
        team2Wickets: 3,
        team2Overs: '5.0',
      },
      result: 'LB Alpha Titans won by 15 runs',
      matchId,
    });

    // Score Doc 1: Rohit batting performance
    await Score.create({
      matchId,
      tournamentId: TOURNAMENT_ID,
      battingTeam: 'LB Alpha Titans',
      bowlingTeam: 'LB Beta Royals',
      runs: 65,
      wickets: 1,
      balls: 30,
      striker: {
        name: 'Rohit Sharma',
        runs: 42,
        balls: 18,
        fours: 3,
        sixes: 4,
      },
      bowler: {
        name: 'Rashid Khan',
        overs: '1.0',
        runsConceded: 8,
        wickets: 2,
      },
      status: 'completed',
    });

    // 4. Test Batting Leaderboards
    console.log('\n[4. Testing Batting Leaderboard Standings]');
    const runsRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=batting&statistic=top_run_scorer`);
    const runsJson = await runsRes.json();
    const leaderRuns = runsJson.data.standings[0];

    assert(leaderRuns.player === 'Rohit Sharma', 'Rohit Sharma ranks #1 Top Run Scorer');
    assert(leaderRuns.value === 42, 'Rohit Sharma has 42 runs');
    assert(leaderRuns.supporting.sixes === 4, 'Rohit Sharma has 4 sixes');
    assert(leaderRuns.supporting.fours === 3, 'Rohit Sharma has 3 fours');

    // Test Strike Rate ranking
    const srRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=batting&statistic=highest_strike_rate`);
    const srJson = await srRes.json();
    const srLeader = srJson.data.standings[0];
    assert(srLeader.player === 'Rohit Sharma', 'Rohit Sharma qualifies and ranks #1 for Strike Rate (18 balls >= 15 min balls)');
    assert(srLeader.displayValue === '233.33', 'Rohit Sharma Strike Rate is 233.33');

    // 5. Test Bowling Leaderboards
    console.log('\n[5. Testing Bowling Leaderboard Standings]');
    const wktRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=bowling&statistic=most_wickets`);
    const wktJson = await wktRes.json();
    const wktLeader = wktJson.data.standings[0];

    assert(wktLeader.player === 'Rashid Khan', 'Rashid Khan ranks #1 in Most Wickets');
    assert(wktLeader.value === 2, 'Rashid Khan has 2 wickets');
    assert(wktLeader.supporting.overs === '1.0', 'Rashid Khan bowled 1.0 over');

    // 6. Test MVP / Impact Calculation
    console.log('\n[6. Testing MVP Impact Score Calculation]');
    const mvpRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=mvp&statistic=impact_score`);
    const mvpJson = await mvpRes.json();
    const mvpLeader = mvpJson.data.standings[0];

    assert(mvpLeader.player === 'Rohit Sharma' || mvpLeader.player === 'Rashid Khan', 'Top performer ranks #1 in MVP');
    assert(mvpLeader.value > 0, `Top MVP player has positive impact score: ${mvpLeader.value}`);
    assert(mvpLeader.supporting.battingImpact !== undefined, 'Includes Batting Impact breakdown');
    assert(mvpLeader.supporting.bowlingImpact !== undefined, 'Includes Bowling Impact breakdown');

    // 7. Test Team Filtering
    console.log('\n[7. Testing Team Filtering]');
    const teamRes = await fetch(`${BASE_URL}/tournaments/${TOURNAMENT_ID}/leaderboard?category=batting&statistic=top_run_scorer&team=LB Alpha Titans`);
    const teamJson = await teamRes.json();

    assert(teamJson.data.standings.every((p) => p.team === 'LB Alpha Titans'), 'All filtered standings belong to LB Alpha Titans');
    assert(teamJson.data.standings.length === 4, 'Filtered team has exactly 4 players');

    // 8. Cleanup test data
    console.log('\n[8. Cleaning Up Test Data]');
    await Registration.deleteMany({ eventId: TOURNAMENT_ID });
    await Fixture.deleteMany({ tournamentId: TOURNAMENT_ID });
    await Score.deleteMany({ tournamentId: TOURNAMENT_ID });
    console.log('Leaderboard test tournament data purged.');

  } catch (err) {
    console.error('Error during test execution:', err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log(`\n========================================`);
    console.log(`LEADERBOARD TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runLeaderboardTests();
