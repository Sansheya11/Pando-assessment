const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const mongoose = require('mongoose');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Simple in-memory request tracking for rate limiting
const requestTracker = {
  requests: new Map(),
  cleanup: function() {
    const now = Date.now();
    for (const [key, time] of this.requests.entries()) {
      if (now - time > 1000) { // Remove entries older than 1 second
        this.requests.delete(key);
      }
    }
  }
};

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  const clientIP = req.ip;
  const now = Date.now();
  const key = `${clientIP}:${req.path}`;
  
  requestTracker.cleanup();
  
  const lastRequest = requestTracker.requests.get(key) || 0;
  if (now - lastRequest < 1000) { // Minimum 1 second between requests
    return res.status(429).json({
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: 1
    });
  }
  
  requestTracker.requests.set(key, now);
  next();
};

// Apply rate limiting to all routes
router.use(rateLimiter);

// Route-specific middleware to log route access
router.use((req, res, next) => {
  console.log(`[Photo Route] ${req.method} ${req.baseUrl}${req.url}`);
  next();
});

// Test route to verify routing is working
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Photo routes are working' });
});

// Get favorite photos - MUST BE BEFORE OTHER ROUTES
router.get('/favorites', async (req, res) => {
  console.log('Received request for favorites');
  try {
    // Check MongoDB connection
    const isConnected = mongoose.connection.readyState === 1;
    console.log('MongoDB connection state:', {
      state: mongoose.connection.readyState,
      isConnected,
      url: mongoose.connection.host
    });

    if (!isConnected) {
      throw new Error('Database connection is not ready');
    }
    
    // Find favorites with explicit favorite: true condition
    const favoritePhotos = await Photo.find({ favorite: true })
      .lean()
      .exec();

    console.log('Found favorite photos:', {
      count: favoritePhotos.length,
      ids: favoritePhotos.map(p => p._id)
    });

    // Transform URLs to be absolute
    const transformedPhotos = favoritePhotos.map(photo => ({
      ...photo,
      url: `/uploads/${photo.filename}`,
      favorite: true
    }));

    console.log('Sending response with photos:', transformedPhotos.length);
    res.json(transformedPhotos);
  } catch (error) {
    console.error('Error in /favorites route:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to fetch favorite photos',
      error: error.message
    });
  }
});

// Get all photos with pagination
router.get('/', async (req, res) => {
  const startTime = Date.now();
  console.log('\nFetching photos from database...');
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(`Query parameters: page=${page}, limit=${limit}, skip=${skip}`);

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        message: 'Database is not connected',
        retryAfter: 5
      });
    }

    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log(`Found ${photos.length} photos in database`);

    // Transform URLs to absolute URLs
    const transformedPhotos = photos.map(photo => {
      const baseUrl = 'http://localhost:9001';
      let imageUrl = photo.url;

      // If URL doesn't start with http or https, make it absolute
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      return {
        ...photo,
        url: imageUrl
      };
    });

    console.log('Transformed photos:', transformedPhotos.map(p => ({
      id: p._id,
      url: p.url
    })));

    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms\n`);

    res.json(transformedPhotos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload photos
router.post('/upload', upload.array('photos', 10), async (req, res) => {
  console.log('\nProcessing photo upload...');
  try {
    if (!req.files || req.files.length === 0) {
      console.log('No files received in request');
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log(`Received ${req.files.length} files:`, 
      req.files.map(f => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype
      }))
    );

    const photos = await Promise.all(req.files.map(async (file) => {
      const photo = new Photo({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        title: file.originalname,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return photo.save();
    }));

    // Transform URLs before sending response
    const photosWithFullUrls = photos.map(photo => ({
      ...photo.toObject(),
      url: `http://localhost:9001${photo.url}`
    }));

    console.log('Successfully saved photos to database:', 
      photosWithFullUrls.map(p => ({
        id: p._id,
        filename: p.filename,
        url: p.url
      }))
    );

    res.status(201).json(photosWithFullUrls);
  } catch (error) {
    console.error('Error uploading photos:', error);
    // Clean up uploaded files if database operation fails
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(path.join(uploadDir, file.filename), (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Toggle favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    console.log('Toggling favorite for photo:', req.params.id);
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      console.log('Photo not found:', req.params.id);
      return res.status(404).json({ message: 'Photo not found' });
    }
    photo.favorite = !photo.favorite;
    await photo.save();
    console.log('Successfully toggled favorite. New state:', photo.favorite);
    res.json(photo);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Delete file from uploads directory
    const filePath = path.join(uploadDir, photo.filename);
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
      // Delete from database even if file deletion fails
      await Photo.deleteOne({ _id: req.params.id });
      res.json({ message: 'Photo deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update photo metadata
router.put('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'tags'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Special handling for tags to ensure they're unique
        if (field === 'tags') {
          photo[field] = [...new Set(req.body[field])]; // Remove duplicates
        } else {
          photo[field] = req.body[field];
        }
      }
    });

    const updatedPhoto = await photo.save();
    console.log('Updated photo metadata:', {
      id: updatedPhoto._id,
      title: updatedPhoto.title,
      description: updatedPhoto.description,
      tags: updatedPhoto.tags
    });

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(400).json({ message: error.message });
  }
});

// Add new route for searching photos by tags
router.get('/search/tags', async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags) {
      return res.status(400).json({ message: 'No tags provided for search' });
    }

    const searchTags = tags.split(',').map(tag => tag.trim());
    const photos = await Photo.find({ tags: { $in: searchTags } });
    
    res.json(photos);
  } catch (error) {
    console.error('Error searching photos by tags:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 