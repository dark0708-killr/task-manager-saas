/**
 * Task Routes - Task Management SaaS
 */

import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskColumn,
  toggleTaskCompletion,
  getUserTasks,
  getOverdueTasks,
} from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.js';
import { validateTask } from '../middleware/validation.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(validateTask, createTask);

router.route('/user/:userId')
  .get(getUserTasks);

router.route('/overdue')
  .get(getOverdueTasks);

router.route('/:id')
  .get(getTask)
  .patch(validateTask, updateTask)
  .delete(deleteTask);

router.route('/:id/assign')
  .patch(assignTask);

router.route('/:id/column')
  .patch(updateTaskColumn);

router.route('/:id/toggle')
  .patch(toggleTaskCompletion);

export default router;