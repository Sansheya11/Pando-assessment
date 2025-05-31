import api from './api';

export const photoService = {
  // Get all photos in an album
  getAlbumPhotos: async (albumId) => {
    try {
      const response = await api.get(`/albums/${albumId}/photos`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch photos');
    }
  },

  // Upload single photo
  uploadPhoto: async (albumId, file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post(`/albums/${albumId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload photo');
    }
  },

  // Batch upload photos
  batchUploadPhotos: async (albumId, files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      const response = await api.post(`/albums/${albumId}/photos/batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload photos');
    }
  },

  // Delete photo
  deletePhoto: async (albumId, photoId) => {
    try {
      const response = await api.delete(`/albums/${albumId}/photos/${photoId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete photo');
    }
  }
}; 