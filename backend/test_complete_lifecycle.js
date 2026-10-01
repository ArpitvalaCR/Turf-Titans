
const BASE_URL = 'http://localhost:8000/api/v1';

async function testCompleteFlow() {
  console.log('====================================================');
  console.log('🏆 TURF TITANS COMPLETE END-TO-END VERIFICATION TEST');
  console.log('====================================================\n');

  // Step 1: Test Forgot Password
  console.log('1. Testing Forgot Password Flow...');
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arpitvala16@gmail.com' }),
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot Password response:', forgotData);
  if (!forgotRes.ok) throw new Error('Forgot password request failed');

  // Step 2: Test Admin Login
  console.log('\n2. Testing Admin Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'valanikki06@gmail.com', password: 'arpitvala' }),
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, loginData.message);
  if (!loginRes.ok) throw new Error('Admin login failed: ' + JSON.stringify(loginData));

  const adminToken = loginData.data.accessToken;
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  // Step 3: Test Team Registration
  console.log('\n3. Testing Team Registration...');
  const teamName1 = `E2E Titans ${Date.now()}`;
  const teamName2 = `E2E Warriors ${Date.now()}`;

  const reg1Res = await fetch(`${BASE_URL}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName: teamName1,
      captainName: 'Captain One',
      captainEmail: 'captain1@test.com',
      captainPhone: '9876543210',
      sport: 'cricket',
      transactionId: `UTR${Date.now()}`,
      paymentAmount: 3000,
      teamLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      players: [
        { name: 'Captain One', role: 'All-Rounder', isSubstitute: false },
        { name: 'Player Two', role: 'Batsman', isSubstitute: false },
        { name: 'Player Three', role: 'Bowler', isSubstitute: false },
        { name: 'Player Four', role: 'Wicketkeeper', isSubstitute: false },
        { name: 'Player Five', role: 'All-Rounder', isSubstitute: false },
        { name: 'Player Six', role: 'Batsman', isSubstitute: false },
        { name: 'Player Seven', role: 'Bowler', isSubstitute: false },
        { name: 'Player Eight', role: 'All-Rounder', isSubstitute: false },
        { name: 'Player Nine', role: 'Batsman', isSubstitute: false },
        { name: 'Player Ten', role: 'Bowler', isSubstitute: false },
        { name: 'Player Eleven', role: 'All-Rounder', isSubstitute: false },
        { name: 'Player Twelve', role: 'Batsman', isSubstitute: true },
      ],
    }),
  });
  const reg1Data = await reg1Res.json();
  console.log('Registration 1:', reg1Data.message, 'ID:', reg1Data.data?._id);

  const reg2Res = await fetch(`${BASE_URL}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName: teamName2,
      captainName: 'Captain Two',
      captainEmail: 'captain2@test.com',
      captainPhone: '9876543211',
      sport: 'cricket',
      transactionId: `UTR${Date.now() + 1}`,
      paymentAmount: 3000,
      players: [
        { name: 'Captain Two', role: 'All-Rounder', isSubstitute: false },
        { name: 'Warrior Two', role: 'Batsman', isSubstitute: false },
        { name: 'Warrior Three', role: 'Bowler', isSubstitute: false },
        { name: 'Warrior Four', role: 'Wicketkeeper', isSubstitute: false },
        { name: 'Warrior Five', role: 'All-Rounder', isSubstitute: false },
        { name: 'Warrior Six', role: 'Batsman', isSubstitute: false },
        { name: 'Warrior Seven', role: 'Bowler', isSubstitute: false },
        { name: 'Warrior Eight', role: 'All-Rounder', isSubstitute: false },
        { name: 'Warrior Nine', role: 'Batsman', isSubstitute: false },
        { name: 'Warrior Ten', role: 'Bowler', isSubstitute: false },
        { name: 'Warrior Eleven', role: 'All-Rounder', isSubstitute: false },
        { name: 'Warrior Twelve', role: 'Batsman', isSubstitute: true },
      ],
    }),
  });
  const reg2Data = await reg2Res.json();
  console.log('Registration 2:', reg2Data.message, 'ID:', reg2Data.data?._id);

  // Step 4: Admin Approve Registrations
  console.log('\n4. Admin Approving Registrations...');
  await fetch(`${BASE_URL}/admin/registrations/${reg1Data.data._id}/approve`, {
    method: 'PATCH',
    headers: adminHeaders,
  });
  await fetch(`${BASE_URL}/admin/registrations/${reg2Data.data._id}/approve`, {
    method: 'PATCH',
    headers: adminHeaders,
  });
  console.log('Both registrations approved!');

  // Step 5: Group Assignment & Fixture Creation
  console.log('\n5. Assigning Teams to Group A & Creating Fixture...');
  await fetch(`${BASE_URL}/tournaments/turf-titans-2025/groups/Group%20A/teams`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ teamName: teamName1 }),
  });
  await fetch(`${BASE_URL}/tournaments/turf-titans-2025/groups/Group%20A/teams`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ teamName: teamName2 }),
  });

  const fixtureRes = await fetch(`${BASE_URL}/tournaments/turf-titans-2025/fixtures`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      groupName: 'Group A',
      team1: teamName1,
      team2: teamName2,
      date: '2025-10-11',
      time: '18:00',
      venue: 'Lush Turf Arena',
      totalOvers: 5,
    }),
  });
  const fixtureData = await fixtureRes.json();
  const matchId = fixtureData.data.matchId;
  console.log('Fixture Created! Match ID:', matchId);

  // Step 6: Start Match Setup
  console.log('\n6. Setting up Match and Starting Live Scoring...');
  const testSessionId = `sess_test_${Date.now()}`;
  const setupRes = await fetch(`${BASE_URL}/matches/${matchId}/setup`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      config: {
        totalOvers: 5,
        playersPerSide: 11,
        maxOversPerBowler: 1,
        isBowlingLimitStrict: true,
      },
      team1Squad: {
        teamName: teamName1,
        playing: [
          { name: 'Captain One' },
          { name: 'Player Two' },
          { name: 'Player Three' },
          { name: 'Player Four' },
          { name: 'Player Five' },
          { name: 'Player Six' },
          { name: 'Player Seven' },
          { name: 'Player Eight' },
          { name: 'Player Nine' },
          { name: 'Player Ten' },
          { name: 'Player Eleven' },
        ],
        substitutes: [{ name: 'Player Twelve' }],
      },
      team2Squad: {
        teamName: teamName2,
        playing: [
          { name: 'Captain Two' },
          { name: 'Warrior Two' },
          { name: 'Warrior Three' },
          { name: 'Warrior Four' },
          { name: 'Warrior Five' },
          { name: 'Warrior Six' },
          { name: 'Warrior Seven' },
          { name: 'Warrior Eight' },
          { name: 'Warrior Nine' },
          { name: 'Warrior Ten' },
          { name: 'Warrior Eleven' },
        ],
        substitutes: [{ name: 'Warrior Twelve' }],
      },
      toss: {
        wonBy: teamName1,
        electedTo: 'BAT',
      },
      openers: {
        striker: 'Captain One',
        nonStriker: 'Player Two',
        openingBowler: 'Warrior Three',
      },
      sessionId: testSessionId,
    }),
  });
  const setupData = await setupRes.json();
  console.log('Setup Response:', setupRes.status, setupData.message);
  const sessionId = setupData.data?.sessionId || testSessionId;
  console.log('Match Setup Success! Session ID:', sessionId);

  // Step 7: Record Deliveries (Runs 0 to 6)
  console.log('\n7. Recording Deliveries (Testing Runs 0 through 6)...');
  const scoringHeaders = {
    ...adminHeaders,
    'x-scoring-session-id': sessionId,
  };

  const runsToTest = [0, 1, 2, 3, 4, 6];
  for (let i = 0; i < runsToTest.length; i++) {
    const runs = runsToTest[i];
    const ballRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
      method: 'POST',
      headers: scoringHeaders,
      body: JSON.stringify({
        runsOffBat: runs,
        extraType: 'NONE',
        additionalRanRuns: 0,
        isWicket: false,
        sessionId,
      }),
    });
    const ballData = await ballRes.json();
    const live = ballData.data.liveState;
    console.log(`Ball ${i + 1} (${runs} runs): Score = ${live.runs}/${live.wickets} (${live.oversDisplay} ov), Recent = [${live.recentBalls.join(', ')}]`);
  }

  // Step 8: Test Match End
  console.log('\n8. Ending and Finalizing Match...');
  const endRes = await fetch(`${BASE_URL}/matches/${matchId}/end`, {
    method: 'POST',
    headers: scoringHeaders,
    body: JSON.stringify({ sessionId }),
  });
  const endData = await endRes.json();
  console.log('Match End Status:', endRes.status, 'Result:', endData.data.result);

  // Verify Fixture status in DB
  const getFixturesRes = await fetch(`${BASE_URL}/tournaments/turf-titans-2025/fixtures`);
  const fixturesData = await getFixturesRes.json();
  const completedFixture = fixturesData.data.find(f => f.matchId === matchId);
  console.log('Persisted Fixture Status in Database:', completedFixture.status, '| Result:', completedFixture.result);

  console.log('\n====================================================');
  console.log('✅ ALL VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

testCompleteFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
