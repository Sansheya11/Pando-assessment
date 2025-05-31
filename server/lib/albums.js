const Album = require('../models/Album');

class AlbumService {
  // Get all albums
  static async getAllAlbums() {
    try {
      return await Album.find();
    } catch (error) {
      throw new Error(`Error fetching albums: ${error.message}`);
    }
  }

  // Get album by ID
  static async getAlbumById(id) {
    try {
      const album = await Album.findById(id);
      if (!album) {
        throw new Error('Album not found');
      }
      return album;
    } catch (error) {
      throw new Error(`Error fetching album: ${error.message}`);
    }
  }

  // Create new album
  static async createAlbum(albumData) {
    try {
      const album = new Album({
        name: albumData.name,
        photos: []
      });
      return await album.save();
    } catch (error) {
      throw new Error(`Error creating album: ${error.message}`);
    }
  }

  // Add photo to album
  static async addPhotoToAlbum(albumId, photoData) {
    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error('Album not found');
      }
      album.photos.push(photoData);
      return await album.save();
    } catch (error) {
      throw new Error(`Error adding photo to album: ${error.message}`);
    }
  }

  // Update album
  static async updateAlbum(albumId, albumData, userId) {
    try {
      const album = await Album.findOneAndUpdate(
        { _id: albumId, createdBy: userId },
        albumData,
        { new: true, runValidators: true }
      );
      if (!album) {
        throw new Error('Album not found');
      }
      return album;
    } catch (error) {
      throw new Error(`Error updating album: ${error.message}`);
    }
  }

  // Delete album
  static async deleteAlbum(albumId, userId) {
    try {
      const album = await Album.findOneAndDelete({ _id: albumId, createdBy: userId });
      if (!album) {
        throw new Error('Album not found');
      }
      return album;
    } catch (error) {
      throw new Error(`Error deleting album: ${error.message}`);
    }
  }
}

module.exports = AlbumService; 