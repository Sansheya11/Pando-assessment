import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InfoSidebar from './InfoSidebar';
import Toast from './Toast';
import './Favorites.css';

const API_BASE_URL = 'http://localhost:9001'; // Add API base URL

function Favorites() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/photos/favorites');
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      showToast('Failed to load favorite photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setSidebarOpen(true);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleUpdatePhoto = async (updatedPhoto) => {
    try {
      const response = await api.put(`/photos/${updatedPhoto._id}`, updatedPhoto);
      setPhotos(photos.map(photo => 
        photo._id === updatedPhoto._id ? response.data : photo
      ));
      showToast('Photo updated successfully');
    } catch (error) {
      console.error('Failed to update photo:', error);
      showToast('Failed to update photo', 'error');
    }
  };

  const handleFavorite = async (photoId) => {
    try {
      const photo = photos.find(p => p._id === photoId);
      const response = await api.put(`/photos/${photoId}`, {
        ...photo,
        favorite: !photo.favorite
      });

      if (!response.data.favorite) {
        // Remove from favorites list if unfavorited
        setPhotos(photos.filter(p => p._id !== photoId));
        setSelectedPhoto(null);
        showToast('Photo removed from favorites');
      } else {
        setPhotos(photos.map(p => p._id === photoId ? response.data : p));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(photos.filter(photo => photo._id !== photoId));
      setSelectedPhoto(null);
      showToast('Photo deleted successfully');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      showToast('Failed to delete photo', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Filter photos based on search query
  const filteredPhotos = photos.filter(photo => {
    const query = searchQuery.toLowerCase();
    return (
      (photo.title || '').toLowerCase().includes(query) ||
      (photo.description || '').toLowerCase().includes(query) ||
      (photo.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className={`favorites-view ${sidebarOpen && selectedPhoto ? 'sidebar-open' : ''}`}>
      <div className="favorites-header">
        <div className="header-left">
          <h1>Favorites</h1>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search favorites by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="favorites-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading favorites...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">favorite_border</span>
            <h2>No favorites yet</h2>
            <p>Photos you mark as favorites will appear here</p>
          </div>
        ) : (
          <div className="photos-grid">
            {filteredPhotos.map(photo => (
              <div 
                key={photo._id} 
                className="photo-item loading"
                onClick={() => handlePhotoClick(photo)}
              >
                <img 
                  src={`${API_BASE_URL}${photo.url}`}
                  alt={photo.title || 'Photo'} 
                  loading="lazy"
                  onLoad={(e) => {
                    e.target.classList.add('loaded');
                    e.target.parentElement.classList.remove('loading');
                  }}
                  onError={(e) => {
                    console.error('Failed to load image:', photo.url);
                    e.target.parentElement.classList.remove('loading');
                    e.target.parentElement.classList.add('error');
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <InfoSidebar
          photo={selectedPhoto}
          onUpdatePhoto={handleUpdatePhoto}
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Favorites;
