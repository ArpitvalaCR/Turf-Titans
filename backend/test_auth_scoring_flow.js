import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const BASE_URL = 'http://localhost:8000/api/v1';

async function testAuthScoringFlow() {
  console.log('===============================================================');
  console.log('TESTING COMPLETE AUTHENTICATION, REFRESH & SCORING FLOW');
  console.log('===============================================================');

  const adminEmail = process.env.ADMIN_EMAIL || 'valanikki06@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 1. Authenticate Admin
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.accessToken) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }

  const { accessToken, refreshToken } = loginData.data;
  console.log('✅ 1. Admin login succeeded with valid accessToken & refreshToken');

  // 2. Fetch matches to find target match
  const fixtureRes = await fetch(`${BASE_URL}/tournaments/turf-titans-2025/fixtures`);
  const fixtureData = await fixtureRes.json();
  const matches = fixtureData.data?.matches || fixtureData.data || [];
  const match = matches[0];
  const matchId = match.matchId;
  console.log(`✅ 2. Target Match ID: ${matchId}`);

  // 3. Test unauthenticated request to protected scoring delivery route -> EXPECT 401
  const unauthRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runsOffBat: 1 }),
  });
  const unauthData = await unauthRes.json();
  if (unauthRes.status === 401 && !unauthData.success) {
    console.log('✅ 3. Unauthenticated scoring request correctly rejected with 401 Authentication Required');
  } else {
    throw new Error(`Expected 401 for unauthenticated request, got: ${unauthRes.status}`);
  }

  // 4. Test expired token behavior -> create a deliberately expired token
  const expiredToken = jwt.sign(
    { _id: loginData.data.admin._id, role: 'admin' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '0s' } // Expired immediately
  );

  const expiredRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${expiredToken}`,
    },
    body: JSON.stringify({ runsOffBat: 1 }),
  });
  const expiredData = await expiredRes.json();
  if (expiredRes.status === 401 && expiredData.message.includes('expired')) {
    console.log(`✅ 4. Expired token correctly detected and rejected: "${expiredData.message}"`);
  } else {
    throw new Error(`Expected 401 expired message, got: ${expiredRes.status} ${JSON.stringify(expiredData)}`);
  }

  // 5. Test token refresh mechanism (/api/v1/auth/refresh)
  const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-refresh-token': refreshToken,
    },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshData = await refreshRes.json();
  if (!refreshData.success || !refreshData.data?.accessToken) {
    throw new Error('Token refresh failed: ' + JSON.stringify(refreshData));
  }
  const newAccessToken = refreshData.data.accessToken;
  console.log('✅ 5. Token refreshed successfully, obtained new valid accessToken');

  // 6. Test Live Scoring Delivery using the refreshed accessToken
  const scoreRes = await fetch(`${BASE_URL}/matches/${matchId}/deliveries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newAccessToken}`,
      'x-scoring-session-id': 'test_auth_session_999',
    },
    body: JSON.stringify({
      runsOffBat: 1,
      extraType: 'NONE',
    }),
  });
  const scoreData = await scoreRes.json();
  if (!scoreData.success) {
    throw new Error('Scoring delivery failed with refreshed token: ' + JSON.stringify(scoreData));
  }
  console.log(`✅ 6. Delivery recorded with refreshed token. Score: ${scoreData.data.liveState.runs}/${scoreData.data.liveState.wickets} (${scoreData.data.liveState.oversDisplay} ov)`);

  // 7. Verify match session data persistence after refresh
  const sessionRes = await fetch(`${BASE_URL}/matches/${matchId}/session`, {
    headers: {
      'Authorization': `Bearer ${newAccessToken}`,
      'x-scoring-session-id': 'test_auth_session_999',
    },
  });
  const sessionData = await sessionRes.json();
  if (!sessionData.success || sessionData.data.liveState.runs !== scoreData.data.liveState.runs) {
    throw new Error('Session fetch failed or mismatch: ' + JSON.stringify(sessionData));
  }
  console.log(`✅ 7. Session refetched & verified from DB. Score persists: ${sessionData.data.liveState.runs}/${sessionData.data.liveState.wickets}, isLockHeldByMe: ${sessionData.data.isLockHeldByMe}`);

  console.log('===============================================================');
  console.log('ALL AUTHENTICATION, REFRESH, & SCORING TESTS PASSED (100%)');
  console.log('===============================================================');
}

testAuthScoringFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
