/**
 * Error Handler Middleware - Task Management SaaS
 */

import jwt from 'jsonwebtoken';
import { MongoError } from 'mongodb';

// Not Found Error
export const notFound = (req, res, next) => {
  const error = new Error(`🔍 Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// JWT Error Handler
export const handleJWTError = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Your token has expired. Please log in again.',
    });
  }

  next(err);
};

// Duplicate Fields Error Handler
export const handleDuplicateFields = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field}: ${value}. Please use a different value.`;
    return new Error(message);
  }
  return err;
};

// Validation Error Handler
export const handleValidationError = (err) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${messages.join('. ')}`;
    return new Error(message);
  }
  return err;
};

// Generic Error Handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  error = handleDuplicateFields(error);

  // Mongoose validation error
  error = handleValidationError(error);

  const statusCode = error.statusCode || 500;
  const status = statusCode < 500 ? 'fail' : 'error';

  res.status(statusCode).json({
    status,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async Handler for catching errors in async functions
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Auth Error Handler
export const unauthorizedError = (message = 'Not authorized to access this resource') => {
  return {
    statusCode: 401,
    status: 'error',
    message,
  };
};

// Forbidden Error Handler
export const forbiddenError = (message = 'You do not have permission to perform this action') => {
  return {
    statusCode: 403,
    status: 'error',
    message,
  };
};

// Rate Limit Error
export const rateLimitError = () => {
  return {
    statusCode: 429,
    status: 'fail',
    message: 'Too many requests from this IP, please try again later',
  };
};