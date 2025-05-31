import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Albums.css';

function Albums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const { albumId } = useParams();
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter albums based on search query
  const filteredAlbums = albums.filter(album => {
    const query = searchQuery.toLowerCase();
    return (
      album.name.toLowerCase().includes(query) ||
      album.photos?.some(photo => photo.title?.toLowerCase().includes(query))
    );
  });

  // Fetch albums list
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await api.get('/albums');
        setAlbums(response.data);
      } catch (error) {
        console.error('Failed to fetch albums:', error);
        setError('Failed to load albums');
      } finally {
        setLoading(false);
      }
    };

    if (!albumId) {
      fetchAlbums();
    }
  }, [albumId]);

  // Fetch single album and its photos when albumId is present
  useEffect(() => {
    const fetchAlbumDetails = async () => {
      if (!albumId) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching album details for:', albumId);
        
        const response = await api.get(`/albums/${albumId}`);
        console.log('Album response:', response.data);
        
        // Transform photo URLs if needed
        const albumWithTransformedUrls = {
          ...response.data,
          photos: response.data.photos?.map(photo => ({
            ...photo,
            url: getPhotoUrl(photo)
          }))
        };
        
        setCurrentAlbum(albumWithTransformedUrls);
      } catch (error) {
        console.error('Failed to fetch album details:', error);
        setError('Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId]);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('Creating album with name:', newAlbumTitle.trim());
      
      const response = await api.post('/albums', {
        name: newAlbumTitle.trim()
      });
      
      console.log('Album creation response:', response);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setAlbums(prevAlbums => [...prevAlbums, response.data]);
      setShowCreateModal(false);
      setNewAlbumTitle('');
      navigate(`/albums/${response.data._id}`);
    } catch (error) {
      console.error('Album creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create album';
      setError(errorMessage);
      // Keep the modal open when there's an error
      setShowCreateModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this album?')) return;

    try {
      await api.delete(`/albums/${albumId}`);
      setAlbums(albums.filter(album => album._id !== albumId));
      navigate('/albums');
    } catch (error) {
      console.error('Failed to delete album:', error);
      setError('Failed to delete album');
    }
  };

  const handleUploadPhotos = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      console.log('Uploading photos to album:', currentAlbum?._id);
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      const response = await api.post(`/albums/${currentAlbum?._id}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);

      // Transform photo URLs and update the current album
      const newPhotos = Array.isArray(response.data) ? response.data : [response.data];
      const transformedPhotos = newPhotos.map(photo => ({
        ...photo,
        url: getPhotoUrl(photo)
      }));

      setCurrentAlbum(prevAlbum => ({
        ...prevAlbum,
        photos: [...(prevAlbum?.photos || []), ...transformedPhotos]
      }));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      setError('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/albums/${albumId}/photos/${photoId}`);
      setPhotos(photos.filter(photo => photo._id !== photoId));
    } catch (error) {
      console.error('Failed to delete photo:', error);
      setError('Failed to delete photo');
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo || !photo.url) return '';
    if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
      return photo.url;
    }
    // Make sure we're using the correct path to access uploaded photos
    return `http://localhost:9001${photo.url}`;
  };

  const getPhotoClassName = (photo) => {
    if (!photo) return 'photo-item';
    
    // We'll determine the size class based on the image dimensions
    // For this example, we'll randomly assign sizes to create a varied layout
    const random = Math.random();
    if (random < 0.2) return 'photo-item big';
    if (random < 0.5) return 'photo-item landscape';
    if (random < 0.8) return 'photo-item portrait';
    return 'photo-item';
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <span className="material-icons">error_outline</span>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // If we're viewing a specific album
  if (albumId) {
    return (
      <div className="album-view">
        <div className="album-header">
          <div className="header-left">
            <Link to="/albums" className="back-button">
              <span className="material-icons">arrow_back</span>
            </Link>
            <h1>{currentAlbum?.name || 'Album'}</h1>
          </div>
        </div>
        <div className="photos-grid">
          {currentAlbum?.photos?.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">photo_library</span>
              <h2>No photos in this album</h2>
              <p>Add some photos to get started</p>
              <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
                <span className="material-icons">add_photo_alternate</span>
                Add photos
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleUploadPhotos}
                multiple
                accept="image/*"
              />
            </div>
          ) : (
            <div className="photos-grid">
              {currentAlbum?.photos?.map(photo => {
                const photoUrl = getPhotoUrl(photo);
                return (
                  <div key={photo._id} className={getPhotoClassName(photo)}>
                    <img
                      src={photoUrl}
                      alt={photo.title || 'Photo'}
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load image:', photoUrl);
                        e.target.src = 'https://via.placeholder.com/300x300?text=Failed+to+load';
                      }}
                    />
                    <button 
                      className="delete-photo-button"
                      onClick={() => handleDeletePhoto(photo._id)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Albums list view
  return (
    <div className="albums-view">
      <div className="albums-header">
        <div className="header-left">
          <h1>Albums</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search albums by name or photo title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="album-search-input"
            />
          </div>
        </div>
        <div className="header-actions">
          <button className="create-album-button" onClick={() => setShowCreateModal(true)}>
            <span className="material-icons">add</span>
            Create album
          </button>
        </div>
      </div>

      <div className="albums-grid">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading albums...</p>
          </div>
        ) : filteredAlbums.length === 0 && searchQuery ? (
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <h2>No albums found</h2>
            <p>Try a different search term</p>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">photo_album</span>
            <h2>No albums yet</h2>
            <p>Create an album to organize your photos</p>
            <button className="create-album-button" onClick={() => setShowCreateModal(true)}>
              <span className="material-icons">add</span>
              Create album
            </button>
          </div>
        ) : (
          filteredAlbums.map(album => (
            <Link to={`/albums/${album._id}`} key={album._id} className="album-item">
              <div className="album-cover">
                <img
                  src={album.coverPhoto?.url}
                  alt={album.name || 'Album cover'}
                  className="album-cover-img"
                />
              </div>
              <div className="album-info">
                <h3 className="album-title">{album.name || 'Untitled Album'}</h3>
                <p className="album-count">
                  {album.photos?.length || 0} {album.photos?.length === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create new album</h2>
              <button className="close-button" onClick={() => setShowCreateModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAlbum}>
              {error && <div className="modal-error">{error}</div>}
              <input
                type="text"
                placeholder="Album title"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null); // Clear error when closing
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button" 
                  disabled={!newAlbumTitle.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Albums;
