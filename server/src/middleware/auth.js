/**
 * Authentication Middleware - Task Management SaaS
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unauthorizedError } from './errorHandler.js';

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password -refreshTokens');

      // Check if user still exists
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'The user belonging to this token no longer exists',
        });
      }

      // Check if user is active
      if (!req.user.active) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been deactivated',
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed',
      });
    }
  }

  // No token provided
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token provided',
    });
  }
};

/**
 * Restrict to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

/**
 * Optional auth middleware (for public routes that can use user data if available)
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshTokens');
    } catch (err) {
      // Ignore token errors for optional auth
      req.user = null;
    }
  }

  next();
};

export default { protect, authorize, optionalAuth };