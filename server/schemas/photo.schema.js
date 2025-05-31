const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'File type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  url: {
    type: String,
    required: [true, 'Photo URL is required']
  },
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: [true, 'Album ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
photoSchema.index({ albumId: 1 });
photoSchema.index({ createdBy: 1 });
photoSchema.index({ createdAt: -1 });

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo; 