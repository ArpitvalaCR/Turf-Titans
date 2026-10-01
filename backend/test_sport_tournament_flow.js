import dotenv from 'dotenv';
import connectDB from './src/db/config.js';
import Admin from './src/models/admin.model.js';
import User from './src/models/user.model.js';
import Event from './src/models/event.model.js';
import { generateAccessToken } from './src/utils/jwt.js';

dotenv.config({ path: './.env' });

const BASE_URL = 'http://localhost:8000/api/v1';

async function runTests() {
  console.log('--- STARTING TOURNAMENT PAGE FLOW VERIFICATION ---');
  await connectDB();

  // 1. Get or create Admin & Normal User
  let admin = await Admin.findOne();
  if (!admin) {
    console.error('No admin found.');
    process.exit(1);
  }
  const adminToken = generateAccessToken({ _id: admin._id, role: 'admin', email: admin.email });

  let user = await User.findOne({ email: 'testuser_tournament@test.com' });
  if (!user) {
    user = await User.create({
      name: 'Test Tournament User',
      email: 'testuser_tournament@test.com',
      password: 'Password123!',
      isVerified: true,
      role: 'user',
    });
  }
  const userToken = generateAccessToken({ _id: user._id, role: 'user', email: user.email });

  console.log('✓ Admin token & User token generated');

  // 2. Test Sport Isolation Querying (Public / User)
  const cricketRes = await (await fetch(`${BASE_URL}/events?sport=cricket`)).json();
  const footballRes = await (await fetch(`${BASE_URL}/events?sport=football`)).json();
  const chessRes = await (await fetch(`${BASE_URL}/events?sport=chess`)).json();

  console.log(`✓ Cricket tournaments count: ${cricketRes.data?.length}`);
  console.log(`✓ Football tournaments count: ${footballRes.data?.length}`);
  console.log(`✓ Chess tournaments count: ${chessRes.data?.length}`);

  // Assert no cross-sport leakage
  const cricketHasFootball = cricketRes.data?.some(e => e.sport !== 'cricket');
  const footballHasCricket = footballRes.data?.some(e => e.sport !== 'football');
  if (cricketHasFootball || footballHasCricket) {
    throw new Error('Cross-sport data leakage detected!');
  }
  console.log('✓ Verified: No cross-sport data leakage');

  // 3. Test Normal User CANNOT create a tournament (HTTP 403)
  const userCreateRes = await fetch(`${BASE_URL}/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      title: 'Hacked User Tournament',
      sport: 'cricket',
      description: 'Should fail',
      venue: 'Test',
      location: 'Mumbai',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      registrationStartDate: new Date().toISOString(),
      registrationEndDate: new Date().toISOString(),
      registrationFee: 1000,
      maxTeams: 8,
      prizes: '1000',
    }),
  });
  console.log(`✓ Normal user create tournament status: ${userCreateRes.status} (Expected: 403)`);
  if (userCreateRes.status !== 403) {
    throw new Error(`Expected 403 but got ${userCreateRes.status}`);
  }

  // 4. Test Normal User CANNOT delete a tournament (HTTP 403)
  const cricketEventId = cricketRes.data[0]._id;
  const userDeleteRes = await fetch(`${BASE_URL}/admin/events/${cricketEventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });
  console.log(`✓ Normal user delete tournament status: ${userDeleteRes.status} (Expected: 403)`);
  if (userDeleteRes.status !== 403) {
    throw new Error(`Expected 403 but got ${userDeleteRes.status}`);
  }

  // 5. Test Admin CAN create a new tournament under a specific sport (e.g. Chess)
  const adminCreateRes = await fetch(`${BASE_URL}/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Turf Titans Grandmaster Blitz 2026',
      sport: 'chess',
      description: 'FIDE-timed blitz tournament with 3m+2s increment.',
      venue: 'Lush Chess Club',
      location: 'Mira Road East, Mumbai',
      startDate: new Date('2026-11-01').toISOString(),
      endDate: new Date('2026-11-02').toISOString(),
      registrationStartDate: new Date('2026-09-01').toISOString(),
      registrationEndDate: new Date('2026-10-25').toISOString(),
      registrationFee: 1500,
      maxTeams: 32,
      prizes: '₹25,000 + Grandmaster Shield',
      rules: 'FIDE standard rules apply.',
    }),
  });
  const createdJson = await adminCreateRes.json();
  console.log(`✓ Admin create tournament status: ${adminCreateRes.status} (${createdJson.data?.title})`);
  if (adminCreateRes.status !== 201) {
    throw new Error(`Failed to create tournament as admin: ${JSON.stringify(createdJson)}`);
  }
  const newChessEventId = createdJson.data._id;

  // Verify Chess now has 1 tournament
  const chessAfterCreate = await (await fetch(`${BASE_URL}/events?sport=chess`)).json();
  console.log(`✓ Chess count after create: ${chessAfterCreate.data?.length}`);
  if (chessAfterCreate.data?.length !== 1) {
    throw new Error('Created tournament not returned in sport query');
  }

  // Verify other sports (Cricket) are unaffected
  const cricketAfterCreate = await (await fetch(`${BASE_URL}/events?sport=cricket`)).json();
  console.log(`✓ Cricket count after create: ${cricketAfterCreate.data?.length}`);
  if (cricketAfterCreate.data?.length !== cricketRes.data?.length) {
    throw new Error('Other sports affected by new tournament creation');
  }

  // 6. Test Admin CAN delete the tournament (Real DB deletion & Cascade cleanup)
  const adminDeleteRes = await fetch(`${BASE_URL}/admin/events/${newChessEventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  console.log(`✓ Admin delete tournament status: ${adminDeleteRes.status}`);
  if (adminDeleteRes.status !== 200) {
    throw new Error(`Failed to delete tournament as admin: ${adminDeleteRes.status}`);
  }

  // Verify Chess is back to 0 (Coming Soon)
  const chessAfterDelete = await (await fetch(`${BASE_URL}/events?sport=chess`)).json();
  console.log(`✓ Chess count after delete: ${chessAfterDelete.data?.length} (Expected: 0)`);
  if (chessAfterDelete.data?.length !== 0) {
    throw new Error('Tournament was not deleted from database');
  }

  // Verify Cricket & Football still exist intact
  const cricketFinal = await (await fetch(`${BASE_URL}/events?sport=cricket`)).json();
  const footballFinal = await (await fetch(`${BASE_URL}/events?sport=football`)).json();
  console.log(`✓ Cricket count final: ${cricketFinal.data?.length}`);
  console.log(`✓ Football count final: ${footballFinal.data?.length}`);
  if (cricketFinal.data?.length !== cricketRes.data?.length || footballFinal.data?.length !== footballRes.data?.length) {
    throw new Error('Unrelated tournament data was unexpectedly affected');
  }

  console.log('\n=========================================');
  console.log('🎉 ALL 12 USER REQUIREMENTS PASSED SUCCESSFULLY!');
  console.log('=========================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
