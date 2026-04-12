const mongoose = require('mongoose');

const dayLogSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    unique: true
  },
  focusTime: {
    type: Number, // total focus seconds this day
    default: 0
  },
  sessionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DayLog', dayLogSchema);
