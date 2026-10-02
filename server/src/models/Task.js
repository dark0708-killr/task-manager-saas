/**
 * Task Model - Task Management SaaS
 */

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot be more than 5000 characters'],
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Task must belong to a board'],
    },
    columnId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    labels: [
      {
        name: String,
        color: String,
      },
    ],
    checklist: [
      {
        text: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    activity: [
      {
        action: {
          type: String,
          enum: ['created', 'updated', 'completed', 'deleted', 'assigned', 'commented'],
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
taskSchema.index({ board: 1, columnId: 1, order: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ createdBy: 1 });

// Virtual for board name
taskSchema.virtual('boardName', {
  ref: 'Board',
  foreignField: '_id',
  localField: 'board',
  justOne: true,
});

// Pre-save middleware: add activity log for creation
taskSchema.pre('save', function (next) {
  if (this.isNew) {
    this.activity.push({
      action: 'created',
      user: this.createdBy,
      timestamp: Date.now(),
      details: { title: this.title },
    });
  }
  next();
});

// Pre-find middleware: filter out archived tasks
taskSchema.pre(/^find/, function (next) {
  this.find({ isArchived: false });
  next();
});

// Instance method: add comment
taskSchema.methods.addComment = async function (authorId, text) {
  this.comments.push({ text, author: authorId });
  this.activity.push({
    action: 'commented',
    user: authorId,
    timestamp: Date.now(),
    details: { text },
  });
  return this.save();
};

// Instance method: toggle completion
taskSchema.methods.toggleCompletion = async function (userId) {
  this.isCompleted = !this.isCompleted;
  this.completedAt = this.isCompleted ? Date.now() : null;
  this.activity.push({
    action: this.isCompleted ? 'completed' : 'updated',
    user: userId,
    timestamp: Date.now(),
    details: { completed: this.isCompleted },
  });
  return this.save();
};

// Instance method: assign task
taskSchema.methods.assign = async function (userId) {
  this.assignee = userId;
  this.activity.push({
    action: 'assigned',
    user: userId,
    timestamp: Date.now(),
    details: { assignee: userId },
  });
  return this.save();
};

// Instance method: update column position
taskSchema.methods.updateColumn = async function (columnId, order) {
  this.columnId = columnId;
  this.order = order;
  return this.save();
};

// Static method: get tasks by board
taskSchema.statics.findByBoard = function (boardId) {
  return this.find({ board: boardId, isArchived: false }).sort({ order: 1 });
};

// Static method: get user's tasks
taskSchema.statics.findByAssignee = function (userId) {
  return this.find({ assignee: userId, isArchived: false })
    .sort({ dueDate: 1 });
};

// Static method: get overdue tasks
taskSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    isCompleted: false,
    isArchived: false,
  }).populate('assignee', 'name email');
};

const Task = mongoose.model('Task', taskSchema);

export default Task;