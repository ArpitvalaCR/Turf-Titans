const BASE_URL = 'http://localhost:8000';

function createMockGoogleJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'mock_signature';
  return `${header}.${body}.${signature}`;
}

async function runTests() {
  console.log('--- Starting Multi-Account Google Sign-In Tests ---');

  // Account 1: Alex Morgan
  const jwt1 = createMockGoogleJwt({
    sub: 'google-sub-alex-101',
    email: 'alex.morgan@example.com',
    name: 'Alex Morgan',
    picture: 'https://example.com/alex.jpg',
  });

  console.log('\n[1] Testing Google Login for Account 1 (Alex Morgan)...');
  const res1 = await fetch(`${BASE_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: jwt1 }),
  });

  const data1 = await res1.json();
  console.log('Response status:', res1.status);
  console.log('Account 1 User:', data1.data?.user?.name, '| Email:', data1.data?.user?.email, '| Username:', data1.data?.user?.username, '| Role:', data1.data?.user?.role);

  if (data1.data?.user?.name !== 'Alex Morgan' || data1.data?.user?.email !== 'alex.morgan@example.com') {
    throw new Error('Account 1 name/email mismatch');
  }

  const token1 = data1.data?.accessToken;

  // Verify /me with token1
  const meRes1 = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const meData1 = await meRes1.json();
  console.log('GET /me for Account 1:', meData1.data?.name, meData1.data?.email);
  if (meData1.data?.name !== 'Alex Morgan') {
    throw new Error('GET /me returned incorrect user for Account 1');
  }

  // Account 2: Marcus Rashford
  const jwt2 = createMockGoogleJwt({
    sub: 'google-sub-marcus-202',
    email: 'marcus.rashford@example.com',
    name: 'Marcus Rashford',
    picture: 'https://example.com/marcus.jpg',
  });

  console.log('\n[2] Testing Google Login for Account 2 (Marcus Rashford)...');
  const res2 = await fetch(`${BASE_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: jwt2 }),
  });

  const data2 = await res2.json();
  console.log('Response status:', res2.status);
  console.log('Account 2 User:', data2.data?.user?.name, '| Email:', data2.data?.user?.email, '| Username:', data2.data?.user?.username, '| Role:', data2.data?.user?.role);

  if (data2.data?.user?.name !== 'Marcus Rashford' || data2.data?.user?.email !== 'marcus.rashford@example.com') {
    throw new Error('Account 2 name/email mismatch! Previous user data was leaked!');
  }

  const token2 = data2.data?.accessToken;

  // Verify /me with token2
  const meRes2 = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const meData2 = await meRes2.json();
  console.log('GET /me for Account 2:', meData2.data?.name, meData2.data?.email);
  if (meData2.data?.name !== 'Marcus Rashford') {
    throw new Error('GET /me returned incorrect user for Account 2');
  }

  // Re-login with Account 1 to ensure existing user is properly retrieved
  console.log('\n[3] Testing Re-login for Account 1 (Alex Morgan)...');
  const res3 = await fetch(`${BASE_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: jwt1 }),
  });
  const data3 = await res3.json();
  console.log('Re-login Account 1 User:', data3.data?.user?.name, '| Email:', data3.data?.user?.email, '| Username:', data3.data?.user?.username);
  if (data3.data?.user?.name !== 'Alex Morgan' || data3.data?.user?.email !== 'alex.morgan@example.com') {
    throw new Error('Account 1 re-login failed to return correct profile');
  }

  console.log('\n>>> ALL MULTI-ACCOUNT GOOGLE AUTH TESTS PASSED SUCCESSFULLY! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
