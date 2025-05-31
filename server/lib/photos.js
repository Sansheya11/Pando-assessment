const Album = require('../models/Album');

class PhotoService {
  // Get photos from album
  static async getAlbumPhotos(albumId) {
    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error('Album not found');
      }
      return album.photos;
    } catch (error) {
      throw new Error(`Error fetching album photos: ${error.message}`);
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
      await album.save();
      return photoData;
    } catch (error) {
      throw new Error(`Error adding photo to album: ${error.message}`);
    }
  }
}

module.exports = PhotoService; 