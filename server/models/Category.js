const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#6366f1'
  },
  type: {
    type: String,
    enum: ['productive', 'unproductive'],
    default: 'productive'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
