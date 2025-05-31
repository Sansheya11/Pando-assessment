import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import InfoSidebar from './InfoSidebar';
import './AlbumView.css';
import exifr from 'exifr'; // For EXIF extraction

const AlbumView = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [photoMetadata, setPhotoMetadata] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter photos based on search query
  const filteredPhotos = photos.filter(photo => {
    const query = searchQuery.toLowerCase();
    const metadata = photoMetadata[photo._id] || {};
    return (
      (metadata.title || '').toLowerCase().includes(query) ||
      (metadata.description || '').toLowerCase().includes(query) ||
      (metadata.tags || []).some(tag => tag.toLowerCase().includes(query)) ||
      (album?.name || '').toLowerCase().includes(query)
    );
  });

  const extractExifData = async (file) => {
    try {
      const exif = await exifr.parse(file);
      return {
        dateTaken: exif?.DateTimeOriginal,
        location: exif?.GPSLatitude && exif?.GPSLongitude ? 
          `${exif.GPSLatitude}, ${exif.GPSLongitude}` : null,
        camera: `${exif?.Make || ''} ${exif?.Model || ''}`.trim() || null
      };
    } catch (error) {
      console.error('Failed to extract EXIF data:', error);
      return null;
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    
    const invalidFiles = files.filter(file => {
      if (file.size > maxSize) {
        showToast(`${file.name} is too large. Maximum size is 5MB.`, 'error');
        return true;
      }
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} is not a supported image type. Please use JPG, PNG, or GIF.`, 'error');
        return true;
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      event.target.value = '';
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Append each file to formData
      files.forEach(file => {
        formData.append('photos', file);
      });

      // Upload photos directly to album
      const response = await api.post(`/albums/${albumId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update photos in state - no URL transformation needed as server sends correct URLs
      setPhotos(prevPhotos => [...prevPhotos, ...response.data]);

      showToast(`Successfully added ${files.length} photo${files.length > 1 ? 's' : ''} to album`);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      showToast('Failed to upload photos. Please try again.', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const updatePhotoMetadata = async (photoId, metadata) => {
    try {
      await api.patch(`/albums/${albumId}/photos/${photoId}/metadata`, metadata);
      setPhotoMetadata(prev => ({
        ...prev,
        [photoId]: { ...prev[photoId], ...metadata }
      }));
      showToast('Photo metadata updated successfully');
    } catch (error) {
      console.error('Failed to update photo metadata:', error);
      showToast('Failed to update photo metadata', 'error');
    }
  };

  const handleMetadataEdit = (photoId) => {
    setEditingPhotoId(photoId);
  };

  const handleMetadataSave = async (photoId, newMetadata) => {
    await updatePhotoMetadata(photoId, newMetadata);
    setEditingPhotoId(null);
  };

  useEffect(() => {
    fetchAlbumDetails();
    fetchAlbumPhotos();
  }, [albumId]);

  const fetchAlbumDetails = async () => {
    try {
      const response = await api.get(`/albums/${albumId}`);
      setAlbum(response.data);
    } catch (error) {
      console.error('Failed to fetch album details:', error);
      showToast('Failed to load album details', 'error');
    }
  };

  const fetchAlbumPhotos = async () => {
    try {
      console.log('Fetching photos for album:', albumId);
      const response = await api.get(`/albums/${albumId}/photos`);
      console.log('Received photos:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Expected array of photos but got:', typeof response.data);
        setPhotos([]);
      } else {
        setPhotos(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch album photos:', error);
      showToast('Failed to load photos', 'error');
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (photoId) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  const handleRemovePhotos = async () => {
    if (!window.confirm('Are you sure you want to remove these photos from the album?')) return;

    try {
      await Promise.all(selectedPhotos.map(photoId => 
        api.delete(`/albums/${albumId}/photos/${photoId}`)
      ));
      setPhotos(prevPhotos => prevPhotos.filter(photo => !selectedPhotos.includes(photo._id)));
      setSelectedPhotos([]);
      showToast(`Successfully removed ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to remove photos:', error);
      showToast('Failed to remove photos', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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
      // Update the photo in the backend
      const response = await api.put(`/photos/${updatedPhoto._id}`, {
        title: updatedPhoto.title,
        description: updatedPhoto.description,
        tags: updatedPhoto.tags
      });

      const updatedPhotoData = response.data;

      // Update the photo in the local state
      setPhotos(photos.map(photo => 
        photo._id === updatedPhoto._id ? { ...photo, ...updatedPhotoData } : photo
      ));

      // Update the selected photo if it's the one being edited
      if (selectedPhoto?._id === updatedPhoto._id) {
        setSelectedPhoto({ ...selectedPhoto, ...updatedPhotoData });
      }

      // Show success toast
      setToast({
        message: 'Photo updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to update photo:', error);
      setToast({
        message: 'Failed to update photo',
        type: 'error'
      });
    }
  };

  const handleInfoClick = (e, photo) => {
    e.stopPropagation(); // Prevent photo selection
    setSelectedPhoto(photo);
    setSidebarOpen(true);
  };

  const handleFavorite = async (e, photoId) => {
    e.stopPropagation();
    try {
      const photo = photos.find(p => p._id === photoId);
      const response = await api.put(`/photos/${photoId}`, {
        ...photo,
        favorite: !photo.favorite
      });
      setPhotos(photos.map(p => p._id === photoId ? response.data : p));
      showToast(response.data.favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleDelete = async (e, photoId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(photos.filter(photo => photo._id !== photoId));
      showToast('Photo deleted successfully');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      showToast('Failed to delete photo', 'error');
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPhotos([...photos, ...response.data]);
      showToast('Photos uploaded successfully');
    } catch (error) {
      console.error('Failed to upload photos:', error);
      showToast('Failed to upload photos', 'error');
    }
  };

  return (
    <div className={`album-view ${sidebarOpen && selectedPhoto ? 'sidebar-open' : ''}`}>
      <div className="album-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/albums')}>
            <span className="material-icons">arrow_back</span>
          </button>
          <h1>{album?.name || 'Album'}</h1>
        </div>
        <div className="header-actions">
          {selectedPhotos.length > 0 ? (
            <>
              <span className="selected-count">{selectedPhotos.length} selected</span>
              <button className="remove-button" onClick={handleRemovePhotos}>
                <span className="material-icons">delete</span>
                Remove from album
              </button>
            </>
          ) : (
            <button className="upload-button" onClick={handleUploadClick}>
              <span className="material-icons">add_photo_alternate</span>
              Add photos
            </button>
          )}
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search photos by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="album-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading album...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">photo_library</span>
            <h2>No photos found</h2>
            <p>{photos.length === 0 ? 'Add photos to see them here' : 'No photos match your search'}</p>
            <button className="upload-button" onClick={handleUploadClick}>
              Add photos
            </button>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map(photo => {
              console.log('Rendering photo:', photo);
              return (
                <div 
                  key={photo._id} 
                  className="photo-item"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.title || 'Photo'} 
                    loading="lazy"
                    onError={(e) => {
                      console.error('Failed to load image:', photo.url);
                      e.target.src = 'placeholder.jpg'; // Add a placeholder image
                    }}
                  />
                  <div className="photo-overlay">
                    <button
                      className="photo-action info"
                      onClick={(e) => handleInfoClick(e, photo)}
                    >
                      <span className="material-icons">info</span>
                    </button>
                    <button
                      className={`photo-action favorite ${photo.favorite ? 'active' : ''}`}
                      onClick={(e) => handleFavorite(e, photo._id)}
                    >
                      <span className="material-icons">
                        {photo.favorite ? 'star' : 'star_border'}
                      </span>
                    </button>
                    <button
                      className="photo-action delete"
                      onClick={(e) => handleDelete(e, photo._id)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        accept="image/*"
        onChange={handleFileSelect}
      />

      {uploading && (
        <div className="upload-progress">
          <div className="loading-spinner small"></div>
          <span>Uploading photos...</span>
        </div>
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
};

export default AlbumView; 