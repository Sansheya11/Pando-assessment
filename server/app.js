const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const photoRoutes = require('./routes/photo.routes');
const albumRoutes = require('./routes/album.routes');

const app = express();

// Enable CORS for all routes with specific origin
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // React app's ports
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory with proper CORS and caching headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'public, max-age=3600');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      status: 'running',
      port: process.env.PORT || 9001
    },
    database: {
      status: dbStatus[dbState],
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected',
      error: app.locals.dbError || null
    }
  });
});

// Database connection state middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1 && !req.path.includes('/health')) {
    return res.status(503).json({
      message: 'Database is not connected',
      details: 'MongoDB Atlas connection failed. Please check your internet connection and database credentials.',
      instructions: [
        'Ensure you have an internet connection',
        'Verify database credentials are correct',
        'Check if IP address is whitelisted in MongoDB Atlas'
      ],
      error: app.locals.dbError || null
    });
  }
  next();
});

// Mount routes
console.log('Registering routes...');
app.use('/api/photos', photoRoutes);
app.use('/api/albums', albumRoutes);

// Connect to MongoDB with retry logic
const connectWithRetry = async (retries = 3, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to MongoDB Atlas (attempt ${i + 1}/${retries})...`);
      
      const MONGODB_URI = 'mongodb+srv://sansheyabaskar:Sansheya%4011@cluster0.dor0gap.mongodb.net/photos?retryWrites=true&w=majority';
      const connection = await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000
      });
      
      if (connection.connection.readyState === 1) {
        console.log('\nSuccessfully connected to MongoDB Atlas:');
        console.log(`- Database: ${connection.connection.name}`);
        console.log(`- Host: ${connection.connection.host}`);
        console.log(`- Port: ${connection.connection.port}`);
        console.log('- State: Connected\n');
        
        app.locals.dbError = null;
        return true;
      } else {
        throw new Error('Connection state is not ready');
      }
    } catch (err) {
      console.error(`\nMongoDB connection attempt ${i + 1} failed:`, {
        message: err.message,
        code: err.code
      });
      
      app.locals.dbError = err.message;
      
      console.log('\nPossible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify database credentials');
      console.log('3. Ensure your IP is whitelisted in MongoDB Atlas\n');
      
      if (i < retries - 1) {
        console.log(`Retrying in ${interval/1000} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  return false;
};

// Initial connection attempt
connectWithRetry().then(connected => {
  if (!connected) {
    console.error('\nFailed to connect to MongoDB Atlas after multiple attempts');
    console.error('The server will continue running but database operations will fail');
    console.error('\nTo fix this:');
    console.error('1. Check your internet connection');
    console.error('2. Verify MongoDB Atlas credentials');
    console.error('3. Whitelist your IP in MongoDB Atlas');
    console.error('\nOnce MongoDB Atlas is running, restart this server.\n');
  }
});

// Reconnection handling
mongoose.connection.on('disconnected', () => {
  console.log('\nMongoDB disconnected! Attempting to reconnect...');
  connectWithRetry(3, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('\nMongoDB connection error:', err);
  app.locals.dbError = err.message;
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    url: req.originalUrl,
    method: req.method,
    error: {
      message: err.message,
      stack: err.stack
    }
  });
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - must be last
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/photos',
      '/api/photos/favorites',
      '/api/photos/test',
      '/api/albums',
      '/api/health'
    ]
  });
});

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
  console.log('\n=== Photo Gallery Server ===');
  console.log(`Server is running on port ${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('- GET  /api/health        - Check server and database status');
  console.log('- GET  /api/photos        - List all photos');
  console.log('- GET  /api/photos/favorites - List favorite photos');
  console.log('- POST /api/photos/upload - Upload new photos');
  console.log('\nIMPORTANT: MongoDB Atlas connection is required');
  console.log('1. Ensure you have an internet connection');
  console.log('2. Verify your database credentials');
  console.log('3. Whitelist your IP in MongoDB Atlas\n');
});

module.exports = app; 