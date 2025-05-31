const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
} else {
  fs.chmodSync(uploadDir, 0o777);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
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

// Upload photos
router.post('/', upload.array('photos', 10), (req, res) => {
  console.log('Processing photo upload...');
  try {
    if (!req.files || req.files.length === 0) {
      console.log('No files received in request');
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log('Files received:', req.files.map(f => ({
      originalname: f.originalname,
      filename: f.filename,
      size: f.size
    })));

    // Transform uploaded files into response format
    const photos = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      title: file.originalname
    }));

    console.log('Successfully processed photos:', photos);
    res.status(201).json(photos);
  } catch (error) {
    console.error('Error uploading photos:', error);
    // Clean up uploaded files if operation fails
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(path.join(uploadDir, file.filename), (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ message: 'Failed to process uploaded files' });
  }
});

module.exports = router; 