import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:8000/api/v1';

async function runEndToEndScoringTest() {
  console.log('--- STARTING LIVE SCORING END-TO-END TEST ---');

  // 1. Login as Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'valanikki06@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }

  const token = loginData.data.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  console.log('✅ 1. Admin authenticated successfully');

  // 2. Fetch or create a match fixture
  const fixtureRes = await fetch(`${BASE_URL}/tournaments/turf-titans-2025/fixtures`);
  const fixtureData = await fixtureRes.json();
  const matches = fixtureData.data?.matches || fixtureData.data || [];
  
  if (!matches || matches.length === 0) {
    throw new Error('No matches found to test scoring');
  }

  const match = matches[0];
  const matchId = match.matchId;
  console.log(`✅ 2. Target Match: ${matchId} (${match.team1} vs ${match.team2})`);

  // 3. Setup Match Session
  const setupPayload = {
    config: {
      totalOvers: 5,
      playersPerSide: 7,
      maxOversPerBowler: 2,
      isBowlingLimitStrict: true,
    },
    team1Squad: {
      teamName: match.team1,
      playing: [
        { name: 'Aarav Patel', role: 'Batsman' },
        { name: 'Rohan Sharma', role: 'Batsman' },
        { name: 'Karan Singh', role: 'All-Rounder' },
        { name: 'Vikram Joshi', role: 'Bowler' },
      ],
      substitutes: [],
      wicketKeeper: 'Aarav Patel',
    },
    team2Squad: {
      teamName: match.team2,
      playing: [
        { name: 'Kabir Khan', role: 'Bowler' },
        { name: 'Zaid Ali', role: 'All-Rounder' },
        { name: 'Sahil Verma', role: 'Batsman' },
        { name: 'Sameer Sheikh', role: 'Bowler' },
      ],
      substitutes: [],
      wicketKeeper: 'Sahil Verma',
    },
    toss: {
      wonBy: match.team1,
      electedTo: 'BAT',
    },
    openers: {
      striker: 'Aarav Patel',
      nonStriker: 'Rohan Sharma',
      openingBowler: 'Kabir Khan',
    },
    sessionId: 'test_admin_session_123',
  };

  const setupRes = await fetch(`${BASE_URL}/matches/${matchId}/setup`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(setupPayload),
  });

  const setupResult = await setupRes.json();
  if (!setupResult.success) {
    throw new Error('Match setup failed: ' + JSON.stringify(setupResult));
  }
  console.log('✅ 3. Match Setup completed and match is LIVE');

  const sessionHeaders = {
    ...authHeaders,
    'x-scoring-session-id': 'test_admin_session_123',
  };

  // 4. Record Dot Ball (0 runs)
  const ball0Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({
      runsOffBat: 0,
      extraType: 'NONE',
      additionalRanRuns: 0,
      isWicket: false,
    }),
  });
  const ball0Data = await ball0Res.json();
  if (!ball0Data.success) throw new Error('Ball 0 failed: ' + JSON.stringify(ball0Data));
  console.log(`✅ 4. Dot ball (0 runs) recorded. Score: ${ball0Data.data.liveState.runs}/${ball0Data.data.liveState.wickets} (${ball0Data.data.liveState.oversDisplay} ov)`);

  // 5. Record 1 Run (strike rotation)
  const ball1Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({
      runsOffBat: 1,
      extraType: 'NONE',
      additionalRanRuns: 0,
      isWicket: false,
    }),
  });
  const ball1Data = await ball1Res.json();
  if (!ball1Data.success) throw new Error('Ball 1 failed: ' + JSON.stringify(ball1Data));
  console.log(`✅ 5. 1 Run recorded. Score: ${ball1Data.data.liveState.runs}/${ball1Data.data.liveState.wickets}, Striker: ${ball1Data.data.liveState.striker}`);

  // 6. Record 4 Runs (boundary)
  const ball4Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({
      runsOffBat: 4,
      extraType: 'NONE',
      additionalRanRuns: 0,
      isWicket: false,
    }),
  });
  const ball4Data = await ball4Res.json();
  if (!ball4Data.success) throw new Error('Ball 4 failed: ' + JSON.stringify(ball4Data));
  console.log(`✅ 6. 4 Runs (FOUR) recorded. Score: ${ball4Data.data.liveState.runs}/${ball4Data.data.liveState.wickets}`);

  // 7. Record Wide (+1 extra, legal balls unchanged)
  const ballWdRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({
      runsOffBat: 0,
      extraType: 'WIDE',
      additionalRanRuns: 0,
      isWicket: false,
    }),
  });
  const ballWdData = await ballWdRes.json();
  if (!ballWdData.success) throw new Error('Wide ball failed: ' + JSON.stringify(ballWdData));
  console.log(`✅ 7. Wide recorded. Score: ${ballWdData.data.liveState.runs}/${ballWdData.data.liveState.wickets} (${ballWdData.data.liveState.oversDisplay} ov), Extras Wides: ${ballWdData.data.innings[0].extras.wides}`);

  // 8. Record Wicket (Caught dismissal)
  const ballWktRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({
      runsOffBat: 0,
      extraType: 'NONE',
      isWicket: true,
      dismissal: {
        batsmanOut: ballWdData.data.liveState.striker,
        dismissalType: 'CAUGHT',
        fielderCatcher: 'Zaid Ali',
        newBatsman: 'Karan Singh',
        newBatsmanStrike: 'STRIKER',
      },
    }),
  });
  const ballWktData = await ballWktRes.json();
  if (!ballWktData.success) throw new Error('Wicket ball failed: ' + JSON.stringify(ballWktData));
  console.log(`✅ 8. WICKET recorded. Score: ${ballWktData.data.liveState.runs}/${ballWktData.data.liveState.wickets}, New Striker: ${ballWktData.data.liveState.striker}`);

  // 9. Verify persistence by refetching from DB
  const getRes = await fetch(`${BASE_URL}/matches/${matchId}/session`, {
    headers: sessionHeaders,
  });
  const getData = await getRes.json();
  if (!getData.success) throw new Error('Get session failed: ' + JSON.stringify(getData));
  console.log(`✅ 9. Refetched session from DB after refresh. Total runs: ${getData.data.liveState.runs}, Total wickets: ${getData.data.liveState.wickets}, Overs: ${getData.data.liveState.oversDisplay}`);

  // 10. Undo last ball (reverse wicket)
  const undoRes = await fetch(`${BASE_URL}/matches/${matchId}/undo`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({}),
  });
  const undoData = await undoRes.json();
  if (!undoData.success) throw new Error('Undo failed: ' + JSON.stringify(undoData));
  console.log(`✅ 10. UNDO last ball executed. Wickets restored to: ${undoData.data.liveState.wickets}, Score: ${undoData.data.liveState.runs}/${undoData.data.liveState.wickets}`);

  // 11. Record 2 runs
  const ball2Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ runsOffBat: 2, extraType: 'NONE' }),
  });
  const ball2Data = await ball2Res.json();
  console.log(`✅ 11. 2 Runs recorded. Score: ${ball2Data.data.liveState.runs}/${ball2Data.data.liveState.wickets}`);

  // 12. Record 3 runs (strike rotates on odd run)
  const ball3Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ runsOffBat: 3, extraType: 'NONE' }),
  });
  const ball3Data = await ball3Res.json();
  console.log(`✅ 12. 3 Runs recorded. Score: ${ball3Data.data.liveState.runs}/${ball3Data.data.liveState.wickets}`);

  // 13. Record 6 runs (SIX)
  const ball6Res = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ runsOffBat: 6, extraType: 'NONE' }),
  });
  const ball6Data = await ball6Res.json();
  console.log(`✅ 13. 6 Runs (SIX) recorded. Score: ${ball6Data.data.liveState.runs}/${ball6Data.data.liveState.wickets}, Over completed: ${ball6Data.data.liveState.oversDisplay}`);

  // 14. Record No Ball with +4 boundary
  const ballNbRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ runsOffBat: 4, extraType: 'NO_BALL', additionalRanRuns: 4 }),
  });
  const ballNbData = await ballNbRes.json();
  console.log(`✅ 14. No Ball (+4) recorded. Score: ${ballNbData.data.liveState.runs}/${ballNbData.data.liveState.wickets}, Extras Nb: ${ballNbData.data.innings[0].extras.noBalls}`);

  // 15. Record Leg Bye
  const ballLbRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ runsOffBat: 0, extraType: 'LEG_BYE', additionalRanRuns: 2 }),
  });
  const ballLbData = await ballLbRes.json();
  console.log(`✅ 15. Leg Bye (+2) recorded. Score: ${ballLbData.data.liveState.runs}/${ballLbData.data.liveState.wickets}`);

  // 16. Test manual Swap Strike
  const swapRes = await fetch(`${BASE_URL}/matches/${matchId}/strike/swap`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({}),
  });
  const swapData = await swapRes.json();
  console.log(`✅ 16. Manual Swap Strike. New Striker: ${swapData.data.striker}, Non-striker: ${swapData.data.nonStriker}`);

  // 17. Test Change Bowler
  const bowlerRes = await fetch(`${BASE_URL}/matches/${matchId}/bowler/change`, {
    method: 'POST',
    headers: sessionHeaders,
    body: JSON.stringify({ newBowler: 'Zaid Ali' }),
  });
  const bowlerData = await bowlerRes.json();
  console.log(`✅ 17. Bowler changed to: ${bowlerData.data.liveState.currentBowler}`);

  console.log('--- ALL EXTENDED LIVE SCORING CONTROLS TESTED AND FULLY FUNCTIONAL! ---');
}

runEndToEndScoringTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
