import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  registerUser,
  verifyUserOtp,
  resendUserOtp,
  loginAdmin,
  logoutAdmin,
  refreshAdminTokens,
  getCurrentAdmin,
  setAuthCookies,
  clearAuthCookies,
  requestPasswordReset,
  resetPasswordWithToken,
  googleLogin,
} from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const result = await registerUser({ name, email, phone, password });

  res.status(201).json(
    new ApiResponse(201, result, 'Verification code sent to email')
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await verifyUserOtp({ email, otp });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Account verified and logged in successfully')
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await resendUserOtp({ email });

  res.status(200).json(
    new ApiResponse(200, result, 'New verification code sent')
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { admin, user, accessToken, refreshToken } = await loginAdmin({ email, password });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(200, { user: user || admin, admin, accessToken, refreshToken }, 'Login successful')
  );
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.admin?._id;
  if (userId) {
    await logoutAdmin(userId);
  }
  clearAuthCookies(res);

  res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers['x-refresh-token'];

  const { admin, user, accessToken, refreshToken: newRefreshToken } =
    await refreshAdminTokens(refreshToken);

  setAuthCookies(res, accessToken, newRefreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      { user: user || admin, admin, accessToken, refreshToken: newRefreshToken },
      'Token refreshed successfully'
    )
  );
});

export const me = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.admin?._id;
  const user = await getCurrentAdmin(userId);

  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await resetPasswordWithToken({ token, newPassword });
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential, idToken, accessToken: googleAccessToken, userInfo } = req.body;
  const { admin, user, accessToken, refreshToken } = await googleLogin({
    credential,
    idToken,
    accessToken: googleAccessToken,
    userInfo,
  });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      { user: user || admin, admin, accessToken, refreshToken },
      'Google sign-in successful'
    )
  );
});

