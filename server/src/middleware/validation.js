/**
 * Validation Middleware - Task Management SaaS
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Validate registration
 */
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d$@$!%*?&]+$/)
    .withMessage(
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  body('passwordConfirm')
    .trim()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

/**
 * Validate login
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .exists()
    .withMessage('Please provide a password'),
];

/**
 * Validate task creation/updation
 */
export const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .notEmpty()
    .withMessage('Title is required'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('board')
    .optional()
    .isMongoId()
    .withMessage('Invalid board ID')
    .custom(async (value, { req }) => {
      const board = await Board.findById(value);
      if (!board) {
        throw new Error('Board not found');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('columnId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Column ID is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
];

/**
 * Validate board creation/updation
 */
export const validateBoard = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be between 1 and 100 characters')
    .notEmpty()
    .withMessage('Board name is required'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
];

/**
 * Validate board ID parameter
 */
export const validateBoardId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid board ID format'),
];

/**
 * Validate task ID parameter
 */
export const validateTaskId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
];

/**
 * Validate pagination
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc'),
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};