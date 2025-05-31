import api from './api';

export const albumService = {
  // Get all albums
  getAllAlbums: async () => {
    try {
      const response = await api.get('/albums');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch albums');
    }
  },

  // Get single album
  getAlbumById: async (albumId) => {
    try {
      const response = await api.get(`/albums/${albumId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch album');
    }
  },

  // Create album
  createAlbum: async (albumData) => {
    try {
      const response = await api.post('/albums', albumData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create album');
    }
  },

  // Update album
  updateAlbum: async (albumId, albumData) => {
    try {
      const response = await api.put(`/albums/${albumId}`, albumData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update album');
    }
  },

  // Delete album
  deleteAlbum: async (albumId) => {
    try {
      const response = await api.delete(`/albums/${albumId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete album');
    }
  }
}; 