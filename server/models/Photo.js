const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true, // Store tags in lowercase for better searching
    validate: {
      validator: function(tag) {
        return tag.length >= 1 && tag.length <= 50; // Ensure reasonable tag length
      },
      message: 'Tags must be between 1 and 50 characters'
    }
  }],
  favorite: {
    type: Boolean,
    default: false
  },
  dimensions: {
    width: Number,
    height: Number
  },
  exif: {
    make: String,
    model: String,
    dateTaken: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    iso: Number,
    focalLength: String,
    aperture: String,
    shutterSpeed: String
  },
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
photoSchema.index({ albumId: 1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ tags: 1 });
photoSchema.index({ favorite: 1 });

// Pre-save middleware to clean up tags
photoSchema.pre('save', function(next) {
  if (this.tags) {
    // Remove duplicates and empty tags
    this.tags = [...new Set(this.tags)].filter(tag => tag.trim().length > 0);
  }
  next();
});

module.exports = mongoose.model('Photo', photoSchema); 