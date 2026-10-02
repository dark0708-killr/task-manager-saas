/**
 * Board Controller - Task Management SaaS
 */

import mongoose from 'mongoose';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import { catchAsync } from '../middleware/errorHandler.js';

/**
 * Get all boards for user
 */
export const getBoards = catchAsync(async (req, res, next) => {
  const boards = await Board.findByUser(req.user.id);

  res.status(200).json({
    status: 'success',
    results: boards.length,
    data: {
      boards,
    },
  });
});

/**
 * Get single board with tasks
 */
export const getBoard = catchAsync(async (req, res, next) => {
  const board = await Board.findById(req.params.id)
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email');

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Create new board
 */
export const createBoard = catchAsync(async (req, res, next) => {
  const boardData = {
    ...req.body,
    owner: req.user.id,
    members: [
      {
        user: req.user.id,
        role: 'admin',
      },
    ],
  };

  const board = await Board.create(boardData);

  res.status(201).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Update board
 */
export const updateBoard = catchAsync(async (req, res, next) => {
  const board = await Board.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Delete board
 */
export const deleteBoard = catchAsync(async (req, res, next) => {
  const board = await Board.findByIdAndDelete(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Invite user to board via email
 */
export const inviteToBoard = catchAsync(async (req, res, next) => {
  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  const inviteCode = await board.generateInviteCode();
  await board.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      inviteCode,
      expiresAt: board.inviteExpires,
    },
  });
});

/**
 * Add member to board
 */
export const addMember = catchAsync(async (req, res, next) => {
  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  await board.addMember(req.body.userId, req.body.role);

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Remove member from board
 */
export const removeMember = catchAsync(async (req, res, next) => {
  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  await board.removeMember(req.params.userId);

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Archive board
 */
export const archiveBoard = catchAsync(async (req, res, next) => {
  const board = await Board.findByIdAndUpdate(
    req.params.id,
    { isArchived: true },
    { new: true }
  );

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Create column in board
 */
export const createColumn = catchAsync(async (req, res, next) => {
  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  const column = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: req.body.name,
    color: req.body.color || '#3b82f6',
    order: board.columns.length,
  };

  board.columns.push(column);
  await board.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

/**
 * Reorder columns
 */
export const reorderColumns = catchAsync(async (req, res, next) => {
  const { columns } = req.body;

  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Board not found',
    });
  }

  board.columns = columns;
  await board.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});

export default {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  inviteToBoard,
  addMember,
  removeMember,
  archiveBoard,
  createColumn,
  reorderColumns,
};