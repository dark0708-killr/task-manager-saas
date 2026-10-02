/**
 * Board Model - Task Management SaaS
 */

import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a board name'],
      trim: true,
      maxlength: [100, 'Board name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board must have an owner'],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'admin'],
          default: 'viewer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    columns: [
      {
        _id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        color: {
          type: String,
          default: '#3b82f6',
        },
      },
    ],
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowFileAttachments: {
        type: Boolean,
        default: true,
      },
      defaultPriority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
      select: false,
    },
    inviteCode: String,
    inviteExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
boardSchema.index({ owner: 1 });
boardSchema.index({ 'members.user': 1 });
boardSchema.index({ inviteCode: 1 });
boardSchema.index({ isArchived: 1 });

// Virtual for task count
boardSchema.virtual('taskCount', {
  ref: 'Task',
  foreignField: 'board',
  localField: '_id',
  count: true,
});

// Pre-save middleware: generate invite code
boardSchema.pre('save', function (next) {
  if (this.isModified('isPrivate') && this.isPrivate === false) {
    this.inviteCode = undefined;
    this.inviteExpires = undefined;
  }
  next();
});

// Instance method: add member
boardSchema.methods.addMember = async function (userId, role = 'viewer') {
  const existingMember = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  if (existingMember) {
    throw new Error('User is already a member of this board');
  }
  this.members.push({ user: userId, role });
  return this.save();
};

// Instance method: remove member
boardSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method: update member role
boardSchema.methods.updateMemberRole = async function (userId, role) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  if (!member) {
    throw new Error('User is not a member of this board');
  }
  member.role = role;
  return this.save();
};

// Instance method: generate invite code
boardSchema.methods.generateInviteCode = async function () {
  const crypto = await import('crypto');
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  this.inviteCode = inviteCode;
  this.inviteExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return inviteCode;
};

// Static method: find boards by user
boardSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
    isArchived: false,
  });
};

const Board = mongoose.model('Board', boardSchema);

export default Board;