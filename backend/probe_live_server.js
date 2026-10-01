async function probe() {
  console.log('--- PROBING LIVE SERVER ON PORT 8000 ---');

  // Test 1: Remove team from group
  try {
    const res1 = await fetch('http://localhost:8000/api/v1/tournaments/turf-titans-2025/groups/GROUP%20A/teams/TestTeam', {
      method: 'DELETE',
    });
    console.log('1. DELETE /api/v1/tournaments/turf-titans-2025/groups/GROUP A/teams/TestTeam -> Status:', res1.status);
    const body1 = await res1.text();
    console.log('   Response Body:', body1);
  } catch (e) {
    console.error('1. Error:', e.message);
  }

  // Test 2: Match session
  try {
    const res2 = await fetch('http://localhost:8000/api/v1/matches/match-test/session', {
      method: 'GET',
    });
    console.log('2. GET /api/v1/matches/match-test/session -> Status:', res2.status);
    const body2 = await res2.text();
    console.log('   Response Body:', body2);
  } catch (e) {
    console.error('2. Error:', e.message);
  }

  // Test 3: Match setup
  try {
    const res3 = await fetch('http://localhost:8000/api/v1/matches/match-test/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    console.log('3. POST /api/v1/matches/match-test/setup -> Status:', res3.status);
    const body3 = await res3.text();
    console.log('   Response Body:', body3);
  } catch (e) {
    console.error('3. Error:', e.message);
  }
}

probe();
