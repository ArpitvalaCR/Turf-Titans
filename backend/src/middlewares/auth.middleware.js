import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Admin from '../models/admin.model.js';
import User from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const decoded = verifyAccessToken(token);

  let account = await Admin.findById(decoded._id).select('-password -refreshToken');
  if (!account) {
    account = await User.findById(decoded._id).select('-password -refreshToken');
  }

  if (!account) {
    throw new ApiError(401, 'Invalid access token or account no longer exists');
  }

  req.user = account;
  req.admin = (account.role?.toLowerCase() === 'admin') ? account : null;
  next();
});

export const optionalVerifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      let account = await Admin.findById(decoded._id).select('-password -refreshToken');
      if (!account) {
        account = await User.findById(decoded._id).select('-password -refreshToken');
      }
      if (account) {
        req.user = account;
        req.admin = (account.role?.toLowerCase() === 'admin') ? account : null;
      }
    } catch {
      // Ignore invalid or expired token on public read endpoints
    }
  }
  next();
});

export const isAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== 'admin') {
    throw new ApiError(403, 'Forbidden: Admin access required to perform this action');
  }
  next();
});

export const isUserOnly = asyncHandler(async (req, _res, next) => {
  if (req.user && req.user.role?.toLowerCase() === 'admin') {
    throw new ApiError(403, 'Forbidden: Team registration is restricted to USER accounts only. Admins should review registrations from the admin dashboard.');
  }
  next();
});
