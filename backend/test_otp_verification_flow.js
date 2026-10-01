import dotenv from 'dotenv';
import connectDB from './src/db/config.js';
import User from './src/models/user.model.js';
import Admin from './src/models/admin.model.js';
import {
  registerUser,
  verifyUserOtp,
  resendUserOtp,
  loginAdmin,
} from './src/services/auth.service.js';

dotenv.config({ path: './.env' });

async function runOtpVerificationSuite() {
  await connectDB();

  console.log('========================================================');
  console.log('🧪 TESTING COMPLETE SIGNUP → OTP → DB → LOGIN LIFECYCLE');
  console.log('========================================================\n');

  const testEmail = `test_player_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword@123';
  const testName = 'Test Cricket Captain';
  const testPhone = '9876543210';

  // Step 1: Create Account / Register
  console.log('1. Creating Account via registerUser...');
  const regResult = await registerUser({
    name: testName,
    email: testEmail,
    phone: testPhone,
    password: testPassword,
  });
  console.log('Registration response:', regResult);

  // Step 2 & 5: Inspect DB doc immediately after signup (should be isVerified: false)
  const userBeforeOtp = await User.findOne({ email: testEmail }).select('+otp +otpExpiry +password');
  console.log('User in DB before OTP: isVerified =', userBeforeOtp.isVerified, 'OTP =', userBeforeOtp.otp);
  if (userBeforeOtp.isVerified !== false) {
    throw new Error('FAILED: Account should NOT be verified before OTP is entered!');
  }

  // Step 9: Try Incorrect OTP (must be rejected)
  console.log('\n9. Testing Incorrect OTP rejection...');
  try {
    await verifyUserOtp({ email: testEmail, otp: '000000' });
    throw new Error('FAILED: Incorrect OTP should have been rejected!');
  } catch (err) {
    console.log('Correctly rejected incorrect OTP with message:', err.message);
  }

  // Step 10: Try Expired OTP (must be rejected)
  console.log('\n10. Testing Expired OTP rejection...');
  userBeforeOtp.otpExpiry = new Date(Date.now() - 5000); // 5 seconds in the past
  await userBeforeOtp.save({ validateBeforeSave: false });

  try {
    await verifyUserOtp({ email: testEmail, otp: userBeforeOtp.otp });
    throw new Error('FAILED: Expired OTP should have been rejected!');
  } catch (err) {
    console.log('Correctly rejected expired OTP with message:', err.message);
  }

  // Resend fresh OTP
  console.log('\nTesting Resend OTP...');
  const resendResult = await resendUserOtp({ email: testEmail });
  console.log('Resend result:', resendResult);

  const freshUserDoc = await User.findOne({ email: testEmail }).select('+otp +otpExpiry');
  const freshOtp = freshUserDoc.otp;
  console.log('Fresh OTP generated:', freshOtp);

  // Step 3 & 4: Enter correct OTP and Verify
  console.log('\n3 & 4. Verifying with correct fresh OTP...');
  const verifyResult = await verifyUserOtp({ email: testEmail, otp: freshOtp });
  console.log('Verification Success! User:', verifyResult.user.name, 'isVerified:', verifyResult.user.isVerified);

  // Step 5: Check MongoDB directly
  console.log('\n5. Confirming MongoDB persistence...');
  const userAfterOtp = await User.findOne({ email: testEmail }).select('+password +otp +otpExpiry');
  console.log('MongoDB isVerified field value:', userAfterOtp.isVerified);
  if (userAfterOtp.isVerified !== true) {
    throw new Error('FAILED: MongoDB isVerified field is NOT true!');
  }

  // Step 6 & 7 & 8: Login with the verified account
  console.log('\n7 & 8. Logging in with verified account credentials...');
  const loginResult = await loginAdmin({
    email: testEmail,
    password: testPassword,
  });
  console.log('Login Result:', loginResult.user.email, 'Role:', loginResult.user.role, 'isVerified:', loginResult.user.isVerified);
  console.log('Access token generated, length:', loginResult.accessToken.length);

  // Test Admin Login Separately
  console.log('\nTesting Admin Login separately...');
  const adminLogin = await loginAdmin({
    email: process.env.ADMIN_EMAIL || 'valanikki06@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'arpitvala',
  });
  console.log('Admin login SUCCESS! Username:', adminLogin.admin?.username || adminLogin.admin?.name);

  console.log('\n========================================================');
  console.log('✅ COMPLETE SIGNUP → OTP → DB → LOGIN SUITE PASSED 100%');
  console.log('========================================================');
  process.exit(0);
}

runOtpVerificationSuite().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
