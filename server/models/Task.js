const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  sessionType: {
    type: String,
    enum: ['focus', 'short_break', 'long_break'],
    default: 'focus'
  },
  pomodoroCount: {
    type: Number,
    default: 1
  },
  comment: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'manual', 'interrupted'],
    default: 'running'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate discomfort logs (break reasons)
taskSchema.virtual('discomfortLogs', {
  ref: 'Discomfort',
  localField: '_id',
  foreignField: 'taskId'
});

module.exports = mongoose.model('Task', taskSchema);
