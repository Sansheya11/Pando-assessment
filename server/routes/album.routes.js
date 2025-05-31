const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Album = require('../models/Album');
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

// Get all albums
router.get('/', async (req, res) => {
  try {
    const albums = await Album.find();
    // Transform URLs in photos
    const albumsWithFullUrls = albums.map(album => {
      const albumObj = album.toObject();
      if (albumObj.photos) {
        albumObj.photos = albumObj.photos.map(photo => ({
          ...photo,
          url: `http://localhost:9001${photo.url}`
        }));
      }
      return albumObj;
    });
    res.json(albumsWithFullUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single album
router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    // Transform URLs in photos
    const albumObj = album.toObject();
    if (albumObj.photos) {
      albumObj.photos = albumObj.photos.map(photo => ({
        ...photo,
        url: `http://localhost:9001${photo.url}`
      }));
    }
    res.json(albumObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new album
router.post('/', async (req, res) => {
  try {
    const album = new Album({
      name: req.body.name,
      photos: []
    });
    const newAlbum = await album.save();
    res.status(201).json(newAlbum);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get album photos
router.get('/:id/photos', async (req, res) => {
  try {
    console.log('Fetching photos for album:', req.params.id);
    const album = await Album.findById(req.params.id);
    if (!album) {
      console.log('Album not found:', req.params.id);
      return res.status(404).json({ message: 'Album not found' });
    }
    
    console.log('Raw album data:', JSON.stringify(album, null, 2));
    console.log('Number of photos in album:', album.photos.length);
    
    res.json(album.photos);
  } catch (error) {
    console.error('Error fetching album photos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add photo to album
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  console.log('Received photo upload request for album:', req.params.id);
  try {
    if (!req.files || req.files.length === 0) {
      console.log('No files received in request');
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log('Files received:', req.files.map(f => ({
      originalname: f.originalname,
      filename: f.filename,
      size: f.size,
      path: f.path
    })));

    const album = await Album.findById(req.params.id);
    if (!album) {
      console.log('Album not found:', req.params.id);
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlink(path.join(uploadDir, file.filename), () => {});
      });
      return res.status(404).json({ message: 'Album not found' });
    }

    const uploadedPhotos = [];
    for (const file of req.files) {
      console.log('Processing file:', file.originalname);
      const photo = {
        url: `/uploads/${file.filename}`,
        title: file.originalname,
        uploadDate: new Date(),
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        _id: new mongoose.Types.ObjectId()
      };
      
      album.photos.push(photo);
      uploadedPhotos.push(photo);
      
      console.log('Added photo to album:', {
        id: photo._id,
        filename: photo.filename,
        url: photo.url
      });
    }

    console.log('Saving album with new photos. Total photos:', album.photos.length);
    await album.save();
    console.log('Successfully saved album');
    
    // Transform URLs before sending response
    const photosWithFullUrls = uploadedPhotos.map(photo => ({
      ...photo,
      url: `http://localhost:9001${photo.url}`
    }));

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
    res.status(500).json({ message: 'Failed to upload photos. Please try again.' });
  }
});

// Remove photo from album
router.delete('/:albumId/photos/:photoId', async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    const photoIndex = album.photos.findIndex(photo => photo._id.toString() === req.params.photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ message: 'Photo not found in album' });
    }

    const photo = album.photos[photoIndex];
    
    // Remove photo from album
    album.photos.splice(photoIndex, 1);
    await album.save();

    // Delete the file if it exists
    if (photo.filename) {
      const filePath = path.join(uploadDir, photo.filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting file:', err);
        }
      });
    }

    res.json({ message: 'Photo removed from album successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add existing photo to album
router.post('/:id/add', async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    // Find the photo
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Find the album
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Add photo to album if not already present
    if (!album.photos.includes(photoId)) {
      album.photos.push(photoId);
      await album.save();
    }

    // Return updated album with populated photos
    const updatedAlbum = await Album.findById(req.params.id).populate('photos');
    res.json(updatedAlbum);
  } catch (error) {
    console.error('Error adding photo to album:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete album
router.delete('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    await album.remove();
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 