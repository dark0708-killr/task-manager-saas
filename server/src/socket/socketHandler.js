/**
 * Socket.io Handler - Task Management SaaS
 */

import { Server, Socket } from 'socket.io';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import { getIO } from '../config/socket.js';

/**
 * Setup socket handlers
 */
export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // Join user room
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join board room
    socket.on('join-board', (boardId) => {
      socket.join(`board:${boardId}`);
      console.log(`User joined board ${boardId}`);
    });

    // Leave board room
    socket.on('leave-board', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`User left board ${boardId}`);
    });

    // Task creation
    socket.on('task-create', async (taskData, callback) => {
      try {
        const task = await Task.create({
          ...taskData,
          createdBy: socket.handshake.auth.userId,
        });

        // Populate references for emission
        const populatedTask = await task
          .populate('assignee', 'name email avatar')
          .populate('createdBy', 'name email')
          .populate('board', 'name');

        // Emit to board room
        io.to(`board:${taskData.board}`).emit('task-created', populatedTask);

        // Emit to assignee if assigned
        if (taskData.assignee) {
          io.to(`user:${taskData.assignee}`).emit('task-assigned', populatedTask);
        }

        callback({ status: 'success', task: populatedTask });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Task update
    socket.on('task-update', async ({ taskId, updates }, callback) => {
      try {
        const task = await Task.findByIdAndUpdate(
          taskId,
          updates,
          { new: true }
        ).populate('assignee', 'name email avatar')
         .populate('createdBy', 'name email')
         .populate('board', 'name');

        if (!task) {
          return callback({ status: 'error', message: 'Task not found' });
        }

        // Emit to board room
        io.to(`board:${task.board._id}`).emit('task-updated', task);

        // Emit to assignee if assigned
        if (task.assignee) {
          io.to(`user:${task.assignee._id}`).emit('task-assigned', task);
        }

        callback({ status: 'success', task });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Task deletion
    socket.on('task-delete', async (taskId, callback) => {
      try {
        const task = await Task.findByIdAndDelete(taskId);

        if (!task) {
          return callback({ status: 'error', message: 'Task not found' });
        }

        // Emit to board room
        io.to(`board:${task.board}`).emit('task-deleted', { taskId });

        callback({ status: 'success' });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Task assignment
    socket.on('task-assign', async ({ taskId, userId }, callback) => {
      try {
        const task = await Task.findById(taskId);

        if (!task) {
          return callback({ status: 'error', message: 'Task not found' });
        }

        await task.assign(userId);
        const populatedTask = await task
          .populate('assignee', 'name email avatar')
          .populate('createdBy', 'name email')
          .populate('board', 'name');

        // Emit to board room
        io.to(`board:${task.board}`).emit('task-updated', populatedTask);

        // Emit to assigned user
        io.to(`user:${userId}`).emit('task-assigned', populatedTask);

        // Emit to previous assignee if exists
        if (task.assignee && task.assignee._id.toString() !== userId) {
          io.to(`user:${task.assignee._id}`).emit('task-unassigned', {
            taskId,
            message: 'Task has been reassigned'
          });
        }

        callback({ status: 'success', task: populatedTask });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Task completion toggle
    socket.on('task-toggle-complete', async (taskId, callback) => {
      try {
        const task = await Task.findById(taskId);

        if (!task) {
          return callback({ status: 'error', message: 'Task not found' });
        }

        await task.toggleCompletion(socket.handshake.auth.userId);
        const populatedTask = await task
          .populate('assignee', 'name email avatar')
          .populate('createdBy', 'name email')
          .populate('board', 'name');

        // Emit to board room
        io.to(`board:${task.board}`).emit('task-updated', populatedTask);

        callback({ status: 'success', task: populatedTask });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Comment creation
    socket.on('comment-create', async ({ taskId, text }, callback) => {
      try {
        const task = await Task.findById(taskId);

        if (!task) {
          return callback({ status: 'error', message: 'Task not found' });
        }

        await task.addComment(socket.handshake.auth.userId, text);
        const populatedTask = await task
          .populate('assignee', 'name email avatar')
          .populate('createdBy', 'name email')
          .populate('board', 'name')
          .populate('comments.author', 'name email avatar');

        // Emit to board room
        io.to(`board:${task.board}`).emit('comment-added', {
          taskId,
          comments: populatedTask.comments
        });

        callback({ status: 'success', task: populatedTask });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Board update
    socket.on('board-update', async ({ boardId, updates }, callback) => {
      try {
        const board = await Board.findByIdAndUpdate(
          boardId,
          updates,
          { new: true }
        ).populate('members.user', 'name email avatar')
         .populate('owner', 'name email');

        if (!board) {
          return callback({ status: 'error', message: 'Board not found' });
        }

        // Emit to board room
        io.to(`board:${boardId}`).emit('board-updated', board);

        callback({ status: 'success', board });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Board member added
    socket.on('member-added', async ({ boardId, userId, role }, callback) => {
      try {
        const board = await Board.findById(boardId);

        if (!board) {
          return callback({ status: 'error', message: 'Board not found' });
        }

        await board.addMember(userId, role);
        const populatedBoard = await board
          .populate('members.user', 'name email avatar')
          .populate('owner', 'name email');

        // Emit to board room
        io.to(`board:${boardId}`).emit('board-updated', populatedBoard);

        // Notify added member
        io.to(`user:${userId}`).emit('board-joined', populatedBoard);

        callback({ status: 'success' });
      } catch (error) {
        callback({ status: 'error', message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

// Utility function to get the io instance from anywhere
export const getIO = () => {
  return global.io;
};

export default setupSocketHandlers;