require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import routes
const albumRoutes = require('./routes/album.routes');
const photoRoutes = require('./routes/photo.routes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
} else {
  fs.chmodSync(uploadDir, 0o777);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-gallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve uploaded files with proper headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.header('Accept-Ranges', 'bytes');
  next();
}, express.static(uploadDir, {
  maxAge: 31536000000, // 1 year in milliseconds
  immutable: true,
  lastModified: true,
  etag: true
}));

app.use('/api/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'public, max-age=31536000');
  res.header('Accept-Ranges', 'bytes');
  next();
}, express.static(uploadDir, {
  maxAge: 31536000000,
  immutable: true,
  lastModified: true,
  etag: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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
  }
});

// Use routes with /api prefix
app.use('/api/albums', albumRoutes);
app.use('/api/photos', photoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ message: 'Unexpected field name in upload.' });
      default:
        return res.status(400).json({ message: err.message });
    }
  }

  // Handle other errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadDir}`);
  console.log('Available endpoints:');
  console.log('- GET    /api/albums');
  console.log('- POST   /api/albums');
  console.log('- GET    /api/albums/:id');
  console.log('- GET    /api/albums/:id/photos');
  console.log('- POST   /api/albums/:id/photos');
  console.log('- POST   /api/photos/upload');
  console.log('- DELETE /api/albums/:id/photos/:photoId');
});

  
 






