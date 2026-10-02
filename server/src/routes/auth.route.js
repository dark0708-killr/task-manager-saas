/**
 * Authentication Routes - Task Management SaaS
 */

import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  refreshToken,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.patch('/verify-email/:token', verifyEmail);
router.get('/refresh-token', refreshToken);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.patch('/update-password', updatePassword);

export default router;