import crypto from 'crypto';
import Admin from '../models/admin.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import sendEmail from '../utils/email.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../utils/jwt.js';

export const initAdminAccount = async () => {
  try {
    const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.warn(
        '[ADMIN INIT] Missing ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD in environment variables.'
      );
      return;
    }

    const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
    const normalizedUsername = ADMIN_USERNAME.trim();

    // Check if an admin account already exists with configured email or username
    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (!existingAdmin) {
      const newAdmin = new Admin({
        username: normalizedUsername,
        email: normalizedEmail,
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
      await newAdmin.save();
      console.log(
        `[ADMIN INIT] Configured Admin account initialized successfully for: ${normalizedEmail}`
      );
    } else {
      console.log(
        `[ADMIN INIT] Configured Admin account verified: ${existingAdmin.email}`
      );
    }
  } catch (error) {
    console.error(
      '[ADMIN INIT ERROR] Failed to initialize admin account:',
      error.message
    );
  }
};

export const registerUser = async ({ name, email, phone, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingAdmin = await Admin.findOne({ email: normalizedEmail });
  if (existingAdmin) {
    throw new ApiError(400, 'An account with this email already exists.');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isVerified) {
    throw new ApiError(400, 'An account with this email already exists. Please log in.');
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user = existingUser;
  if (user) {
    user.name = name;
    user.phone = phone || user.phone;
    user.password = password;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  } else {
    user = new User({
      name,
      email: normalizedEmail,
      phone: phone || '',
      password,
      role: 'user',
      isVerified: false,
      otp,
      otpExpiry,
    });
    await user.save();
  }

  // Send OTP Email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060b18; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #74c004; font-size: 24px; text-transform: uppercase; margin: 0;">TURF TITANS</h1>
        <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Account Verification</p>
      </div>
      <p style="font-size: 15px; color: #cbd5e1;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Your 6-digit verification code to complete your Turf Titans account registration is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #74c004; background: rgba(116, 192, 4, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(116, 192, 4, 0.3); font-family: monospace;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes. If you did not request this registration, please ignore this email.</p>
    </div>
  `;

  const maskedEmail = normalizedEmail.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => `${f}***${d}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH DEV] OTP generated for ${maskedEmail}`);
  }

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Turf Titans - Account Verification Code',
      html: emailHtml,
    });
  } catch (err) {
    console.error('[EMAIL ERROR] Failed to send verification email:', err.message);
  }

  return {
    email: normalizedEmail,
    message: 'Verification OTP sent to your email.',
  };
};

export const verifyUserOtp = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry +refreshToken');

  if (!user) {
    throw new ApiError(404, 'No account found with this email.');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'Account is already verified. Please log in.');
  }

  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, 'No active OTP found. Please request a new OTP.');
  }

  if (new Date() > new Date(user.otpExpiry)) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  if (user.otp !== otp.trim()) {
    throw new ApiError(400, 'Invalid OTP code. Please check and try again.');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).select('-password -refreshToken -otp -otpExpiry');

  return { user: safeUser, accessToken, refreshToken };
};

export const resendUserOtp = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry');

  if (!user) {
    throw new ApiError(404, 'No account found with this email.');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'Account is already verified. Please log in.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060b18; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #74c004; font-size: 24px; text-transform: uppercase; margin: 0;">TURF TITANS</h1>
        <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Account Verification</p>
      </div>
      <p style="font-size: 15px; color: #cbd5e1;">Hello <strong>${user.name}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Your new 6-digit verification code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #74c004; background: rgba(116, 192, 4, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(116, 192, 4, 0.3); font-family: monospace;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes.</p>
    </div>
  `;

  const maskedResendEmail = normalizedEmail.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => `${f}***${d}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH DEV] Resent OTP generated for ${maskedResendEmail}`);
  }

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Turf Titans - New Verification Code',
      html: emailHtml,
    });
  } catch (err) {
    console.error('[EMAIL ERROR] Failed to send resend OTP email:', err.message);
  }

  return {
    email: normalizedEmail,
    message: 'New OTP sent to your email.',
  };
};

export const loginAdmin = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check Admin model first
  let account = await Admin.findOne({ email: normalizedEmail }).select('+password +refreshToken');
  let isAdminAccount = true;

  if (!account) {
    // 2. Check User model
    account = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');
    isAdminAccount = false;
  }

  if (!account || !(await account.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!isAdminAccount && !account.isVerified) {
    throw new ApiError(403, 'Account is not verified. Please verify your OTP to continue.', [
      { needsVerification: true, email: normalizedEmail },
    ]);
  }

  const accessToken = generateAccessToken(
    account._id,
    account.role || (isAdminAccount ? 'admin' : 'user')
  );
  const refreshToken = generateRefreshToken(account._id);

  account.refreshToken = refreshToken;
  await account.save({ validateBeforeSave: false });

  const safeAccount = isAdminAccount
    ? await Admin.findById(account._id).select('-password -refreshToken')
    : await User.findById(account._id).select('-password -refreshToken -otp -otpExpiry');

  return {
    admin: safeAccount,
    user: safeAccount,
    accessToken,
    refreshToken,
  };
};

export const logoutAdmin = async (userId) => {
  await Admin.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

export const refreshAdminTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  const decoded = verifyRefreshToken(refreshToken);

  let account = await Admin.findById(decoded._id).select('+refreshToken');
  let isAdminAccount = true;

  if (!account) {
    account = await User.findById(decoded._id).select('+refreshToken');
    isAdminAccount = false;
  }

  if (!account || account.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const newAccessToken = generateAccessToken(
    account._id,
    account.role || (isAdminAccount ? 'admin' : 'user')
  );
  const newRefreshToken = generateRefreshToken(account._id);

  account.refreshToken = newRefreshToken;
  await account.save({ validateBeforeSave: false });

  const safeAccount = isAdminAccount
    ? await Admin.findById(account._id).select('-password -refreshToken')
    : await User.findById(account._id).select('-password -refreshToken');

  return {
    admin: safeAccount,
    user: safeAccount,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getCurrentAdmin = async (userId) => {
  let account = await Admin.findById(userId).select('-password -refreshToken');
  if (!account) {
    account = await User.findById(userId).select('-password -refreshToken');
  }
  if (!account) throw new ApiError(404, 'User not found');
  return account;
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', accessTokenCookieOptions);
  res.clearCookie('refreshToken', refreshTokenCookieOptions);
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    throw new ApiError(400, 'Email address is required');
  }

  const emailRegex = new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
  let account = await Admin.findOne({ email: emailRegex }).select('+passwordResetToken +passwordResetExpires');
  if (!account) {
    account = await User.findOne({ email: emailRegex }).select('+passwordResetToken +passwordResetExpires');
  }

  // To prevent account enumeration, if no account found, return generic success message
  if (!account) {
    return { message: 'If an account exists for this email, password reset instructions have been sent.' };
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  account.passwordResetToken = hashedToken;
  account.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await account.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060b18; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #74c004; font-size: 24px; text-transform: uppercase; margin: 0;">TURF TITANS</h1>
        <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Password Reset Request</p>
      </div>
      <p style="font-size: 15px; color: #cbd5e1;">Hello,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">You requested to reset your password for your Turf Titans account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #74c004; color: #060b18; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 14px; display: inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">Or copy and paste this URL into your browser:</p>
      <p style="font-size: 12px; color: #74c004; word-break: break-all;">${resetUrl}</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This reset link is valid for 30 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  // Safe metadata logging: DO NOT log tokens or reset URLs
  const maskedEmail = normalizedEmail.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => `${f}***${d}`);
  console.log(`[AUTH] Password reset requested for ${maskedEmail}`);

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Turf Titans - Password Reset Request',
      html: emailHtml,
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send password reset email for ${maskedEmail}:`, err.message);
  }

  return { message: 'If an account exists for this email, password reset instructions have been sent.' };
};

export const resetPasswordWithToken = async ({ token, newPassword }) => {
  if (!token) {
    throw new ApiError(400, 'Password reset token is required');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  let account = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +refreshToken +passwordResetToken +passwordResetExpires');

  if (!account) {
    account = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +refreshToken +passwordResetToken +passwordResetExpires');
  }

  if (!account) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  // Update password and clear reset tokens
  account.password = newPassword;
  account.passwordResetToken = undefined;
  account.passwordResetExpires = undefined;
  account.refreshToken = undefined;
  await account.save();

  const maskedAccountEmail = (account.email || '').replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => `${f}***${d}`);
  console.log(`[AUTH] Password reset successfully completed for ${maskedAccountEmail}`);

  return { message: 'Password has been reset successfully. You can now log in with your new password.' };
};

export const googleLogin = async ({ credential, idToken, accessToken: googleAccessToken, userInfo }) => {
  const token = credential || idToken;
  let googleEmail = '';
  let googleName = '';
  let googleSub = '';
  let googlePicture = '';

  if (token) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (response.ok) {
        const tokenInfo = await response.json();
        googleEmail = tokenInfo.email || '';
        const rawName = tokenInfo.name || `${tokenInfo.given_name || ''} ${tokenInfo.family_name || ''}`.trim() || tokenInfo.email?.split('@')[0];
        googleName = rawName?.trim() || '';
        googleSub = tokenInfo.sub || '';
        googlePicture = tokenInfo.picture || '';
      } else {
        throw new Error('Tokeninfo verification failed');
      }
    } catch (err) {
      // Decode JWT payload safely
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
          if (decoded.email) {
            googleEmail = decoded.email;
            const rawName = decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim() || decoded.email.split('@')[0];
            googleName = rawName?.trim() || '';
            googleSub = decoded.sub || '';
            googlePicture = decoded.picture || '';
          }
        }
      } catch (jwtErr) {
        throw new ApiError(400, 'Invalid Google authentication token');
      }
    }
  } else if (userInfo && userInfo.email) {
    googleEmail = userInfo.email;
    const rawName = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || userInfo.email.split('@')[0];
    googleName = rawName?.trim() || '';
    googleSub = userInfo.sub || userInfo.id || '';
    googlePicture = userInfo.picture || '';
  }

  if (!googleEmail) {
    throw new ApiError(400, 'Google authentication failed. No valid email received.');
  }

  const normalizedEmail = googleEmail.toLowerCase().trim();
  const displayName = googleName || normalizedEmail.split('@')[0];

  // Check if Admin exists with this email
  const existingAdmin = await Admin.findOne({ email: normalizedEmail }).select('+refreshToken');
  if (existingAdmin) {
    const accessToken = generateAccessToken(existingAdmin._id, existingAdmin.role || 'admin');
    const refreshToken = generateRefreshToken(existingAdmin._id);
    existingAdmin.refreshToken = refreshToken;
    await existingAdmin.save({ validateBeforeSave: false });
    const safeAdmin = await Admin.findById(existingAdmin._id).select('-password -refreshToken');
    return {
      admin: safeAdmin,
      user: safeAdmin,
      accessToken,
      refreshToken,
    };
  }

  // Check if User exists
  let user = await User.findOne({ email: normalizedEmail }).select('+refreshToken');
  if (user) {
    user.isVerified = true;
    if (googleSub) user.googleId = googleSub;
    if (googlePicture) user.avatar = googlePicture;
    if (googleName && (!user.name || user.name === normalizedEmail.split('@')[0])) {
      user.name = googleName;
    }
    user.authProvider = 'google';
  } else {
    user = new User({
      name: displayName,
      email: normalizedEmail,
      googleId: googleSub || null,
      avatar: googlePicture || null,
      role: 'user',
      isVerified: true,
      authProvider: 'google',
    });
  }

  const accessToken = generateAccessToken(user._id, user.role || 'user');
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).select('-password -refreshToken -otp -otpExpiry');
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

