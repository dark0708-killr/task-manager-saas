/**
 * Board Routes - Task Management SaaS
 */

import express from 'express';
import {
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
} from '../controllers/board.controller.js';
import { protect } from '../middleware/auth.js';
import { validateBoard } from '../middleware/validation.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.route('/')
  .get(getBoards)
  .post(validateBoard, createBoard);

router.route('/me')
  .get(getBoards);

router.route('/invite/:code')
  .get(joinBoard);

router.route('/:id')
  .get(getBoard)
  .patch(validateBoard, updateBoard)
  .delete(deleteBoard);

router.route('/:id/invite')
  .post(inviteToBoard);

router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:userId')
  .delete(removeMember);

router.route('/:id/archive')
  .patch(archiveBoard);

router.route('/:id/columns')
  .post(createColumn);

router.route('/:id/columns/reorder')
  .patch(reorderColumns);

export default router;

/**
 * Join board via invite code
 */
import { catchAsync } from '../middleware/errorHandler.js';
import Board from '../models/Board.js';

const joinBoard = catchAsync(async (req, res, next) => {
  const hashedCode = req.params.code;

  const board = await Board.findOne({
    inviteCode: hashedCode,
    inviteExpires: { $gt: Date.now() },
  });

  if (!board) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid or expired invite code',
    });
  }

  if (!board.isPrivate) {
    const userExists = board.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!userExists) {
      await board.addMember(req.user._id, 'viewer');
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      board,
    },
  });
});