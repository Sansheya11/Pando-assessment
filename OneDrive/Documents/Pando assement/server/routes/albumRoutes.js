const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Photo = require('../models/Photo');

// Create a new album
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Album name is required' });

    const album = new Album({ name });
    await album.save();
    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Get all albums with their photos
router.get('/', async (req, res) => {
  try {
    const albums = await Album.find().populate('photos');
    res.status(200).json(albums);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Add a photo to an album
router.post('/:albumId/add', async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) return res.status(400).json({ error: 'Photo ID is required' });

    const album = await Album.findById(req.params.albumId);
    if (!album) return res.status(404).json({ error: 'Album not found' });

    if (!album.photos.includes(photoId)) {
      album.photos.push(photoId);
      await album.save();
    }

    const updatedAlbum = await Album.findById(album._id).populate('photos');
    res.status(200).json(updatedAlbum);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add photo to album' });
  }
});

// Get all photos in a specific album
router.get('/:albumId/photos', async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId).populate('photos');
    if (!album) return res.status(404).json({ error: 'Album not found' });

    res.status(200).json(album.photos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch album photos' });
  }
});

// Remove a photo from an album
router.post('/:albumId/remove', async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) return res.status(400).json({ error: 'Photo ID is required' });

    const album = await Album.findById(req.params.albumId);
    if (!album) return res.status(404).json({ error: 'Album not found' });

    album.photos = album.photos.filter(p => p.toString() !== photoId);
    await album.save();

    const updatedAlbum = await Album.findById(album._id).populate('photos');
    res.status(200).json({ message: 'Photo removed from album', album: updatedAlbum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove photo from album' });
  }
});

module.exports = router;
