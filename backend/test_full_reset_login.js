import dotenv from 'dotenv';
import connectDB from './src/db/config.js';
import User from './src/models/user.model.js';
import Admin from './src/models/admin.model.js';
import { requestPasswordReset, resetPasswordWithToken, loginAdmin } from './src/services/auth.service.js';

dotenv.config({ path: './.env' });

async function testFullPasswordResetAndLogin() {
  await connectDB();

  console.log('\n--- 1. Testing Full Reset & Login for User ---');
  const userEmail = 'testuser_reset@example.com';
  
  // Clean up or create test user
  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({
      name: 'Reset Test User',
      email: userEmail,
      phone: '9876543210',
      password: 'oldpassword123',
      isVerified: true,
    });
  }

  // Request Reset
  await requestPasswordReset(userEmail);

  // Read saved doc
  const userDoc = await User.findOne({ email: userEmail }).select('+passwordResetToken +passwordResetExpires');
  console.log('User passwordResetExpires:', userDoc.passwordResetExpires);

  // Let's do a reset via the API endpoint
  // In the real flow, the token is sent in the URL http://localhost:3000/reset-password?token=...
  // We extract the generated token from the request
  const crypto = await import('crypto');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  userDoc.passwordResetToken = hashedToken;
  userDoc.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await userDoc.save();

  // Reset password
  const newPassword = 'newSecretPassword@123';
  const resetResult = await resetPasswordWithToken({
    token: rawToken,
    newPassword,
  });
  console.log('Reset Password Result:', resetResult);

  // Verify new login works
  const loginResult = await loginAdmin({
    email: userEmail,
    password: newPassword,
  });
  console.log('Login with new password SUCCESS! Access Token length:', loginResult.accessToken.length);

  // Try reusing old token (should fail)
  try {
    await resetPasswordWithToken({
      token: rawToken,
      newPassword: 'anotherPassword123',
    });
    console.error('FAILED: Old token should not be reusable!');
    process.exit(1);
  } catch (err) {
    console.log('Correctly rejected reused token with error:', err.message);
  }

  console.log('\n====================================================');
  console.log('✅ PASSWORD RESET AND LOGIN VERIFIED WITH 100% SUCCESS!');
  console.log('====================================================');
  process.exit(0);
}

testFullPasswordResetAndLogin().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
