/**
 * Task Controller - Task Management SaaS
 */

import Task from '../models/Task.js';
import { catchAsync } from '../middleware/errorHandler.js';

/**
 * Get all tasks with pagination and filtering
 */
export const getTasks = catchAsync(async (req, res, next) => {
  const query = Task.find().populate('assignee', 'name email avatar');

  // Filtering
  if (req.query.board) {
    query.find({ board: req.query.board });
  }
  if (req.query.columnId) {
    query.find({ columnId: req.query.columnId });
  }
  if (req.query.assignee) {
    query.find({ assignee: req.query.assignee });
  }
  if (req.query.search) {
    query.find({ $text: { $search: req.query.search } });
  }

  const tasks = await query;

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

/**
 * Get single task
 */
export const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('board', 'name');

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Create new task
 */
export const createTask = catchAsync(async (req, res, next) => {
  const taskData = { ...req.body, createdBy: req.user.id };

  const task = await Task.create(taskData);

  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Update task
 */
export const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Delete task
 */
export const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Assign task
 */
export const assignTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  task.assign(req.body.userId);
  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Update task column position
 */
export const updateTaskColumn = catchAsync(async (req, res, next) => {
  const { columnId, order } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  await task.updateColumn(columnId, order);

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Toggle task completion
 */
export const toggleTaskCompletion = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      status: 'fail',
      message: 'Task not found',
    });
  }

  await task.toggleCompletion(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Get tasks for a specific user
 */
export const getUserTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.findByAssignee(req.params.userId)
    .populate('assignee', 'name email avatar')
    .populate('board', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

/**
 * Get overdue tasks
 */
export const getOverdueTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.findOverdue()
    .populate('assignee', 'name email avatar')
    .populate('board', 'name');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

export default {
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
};