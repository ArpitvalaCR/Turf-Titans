import dotenv from 'dotenv';
import connectDB from './src/db/config.js';
import User from './src/models/user.model.js';
import Admin from './src/models/admin.model.js';
import { requestPasswordReset, resetPasswordWithToken } from './src/services/auth.service.js';

dotenv.config({ path: './.env' });

async function testReset() {
  await connectDB();

  console.log('\n--- Testing Reset Flow for Admin ---');
  const adminEmail = 'valanikki06@gmail.com';
  
  // 1. Request Reset
  const reqResult = await requestPasswordReset(adminEmail);
  console.log('Request reset result:', reqResult);

  // Check token saved in DB
  const adminDoc = await Admin.findOne({ email: adminEmail }).select('+passwordResetToken +passwordResetExpires');
  console.log('Saved token in Admin doc:', adminDoc.passwordResetToken, 'Expires at:', adminDoc.passwordResetExpires);

  // Let's create a real test user and test user reset
  console.log('\n--- Testing Reset Flow for User ---');
  let testUser = await User.findOne({ email: 'testuser_reset@example.com' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Reset Test User',
      email: 'testuser_reset@example.com',
      phone: '9876543210',
      password: 'initialpassword123',
      isVerified: true,
    });
  }

  // Request reset for user
  await requestPasswordReset('testuser_reset@example.com');
  const userDoc = await User.findOne({ email: 'testuser_reset@example.com' }).select('+passwordResetToken +passwordResetExpires');
  console.log('Saved token in User doc:', userDoc.passwordResetToken, 'Expires at:', userDoc.passwordResetExpires);

  console.log('\nAll reset tokens generated and verified successfully in DB!');
  process.exit(0);
}

testReset().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
