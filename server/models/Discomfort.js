const mongoose = require('mongoose');

const discomfortSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['distraction', 'boredom', 'fatigue', 'urge', 'anxiety', 'custom'],
    required: [true, 'Discomfort type is required']
  },
  intensity: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Intensity is required']
  },
  trigger: {
    type: String,
    enum: ['phone', 'environment', 'thoughts', 'hunger', 'unknown'],
    default: 'unknown'
  },
  actionTaken: {
    type: String,
    enum: ['ignored', 'gave_in', 'switched_task', 'took_break'],
    default: 'ignored'
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discomfort', discomfortSchema);
