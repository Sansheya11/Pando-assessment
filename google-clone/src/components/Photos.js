import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import PhotoDetails from './PhotoDetails';
import './Photos.css';

const PhotoItem = React.memo(({ photo, onFavorite, onDelete, onShowDetails, onFullView, loading }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    console.error('Failed to load image:', photo.url);
    e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found';
    setImageLoaded(true);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!loading) {
      onFavorite(photo._id);
    }
  };

  return (
    <div 
      className={`photo-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onFullView(photo)}
      onMouseEnter={() => setIsSelected(true)}
      onMouseLeave={() => setIsSelected(false)}
    >
      <div className={`photo-wrapper ${!imageLoaded ? 'loading' : ''}`}>
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.title || 'Photo'}
          className={imageLoaded ? 'loaded' : ''}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <div className="photo-overlay">
          <button
            className="photo-action info"
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails(photo);
            }}
            disabled={loading}
          >
            <span className="material-icons">info</span>
          </button>
          <button
            className={`photo-action favorite ${photo.favorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            disabled={loading}
            data-animating={photo.animatingFavorite}
            data-tooltip={photo.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className="material-icons">
              {photo.favorite ? 'star' : 'star_border'}
            </span>
          </button>
          <button
            className="photo-action delete"
            onClick={(e) => {
              e.stopPropagation();
              !loading && onDelete(photo._id);
            }}
            disabled={loading}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>
      {photo.title && <div className="photo-title">{photo.title}</div>}
    </div>
  );
});

const FullViewPhoto = ({ photo, onClose, onFavorite, onDelete, onShowDetails, showingInfo }) => {
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timer;
    if (showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  return (
    <div 
      className="full-view-container"
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`full-view-controls ${showControls ? 'visible' : ''}`}>
        <div className="left-controls">
          <button className="back-button" onClick={onClose}>
            <span className="material-icons">arrow_back</span>
          </button>
        </div>
        <div className="right-controls">
          <button 
            className={`photo-action info ${showingInfo ? 'active' : ''}`}
            onClick={() => onShowDetails(photo)}
            title="Information"
          >
            <span className="material-icons">info</span>
          </button>
          <button 
            className={`photo-action favorite ${photo.favorite ? 'active' : ''}`}
            onClick={() => onFavorite(photo._id)}
            title={photo.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className="material-icons">
              {photo.favorite ? 'star' : 'star_border'}
            </span>
          </button>
          <button 
            className="photo-action delete"
            onClick={() => onDelete(photo._id)}
            title="Delete"
          >
            <span className="material-icons">delete</span>
          </button>
          <button className="close-button" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>
      <div className="full-view-content">
        <img src={photo.url} alt={photo.title || 'Photo'} />
      </div>
    </div>
  );
};

function Photos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [fullViewPhoto, setFullViewPhoto] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const { albumId } = useParams();

  // Use a ref to track if the component is mounted and store the current request
  const isMounted = useRef(true);
  const currentRequest = useRef(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (currentRequest.current) {
        currentRequest.current.abort();
      }
    };
  }, []);

  const fetchPhotos = useCallback(async (pageNum = 1) => {
    if (loading || !isMounted.current) return;

    // Cancel any existing request
    if (currentRequest.current) {
      currentRequest.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    currentRequest.current = abortController;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching photos for page:', pageNum);
      const endpoint = albumId ? `/albums/${albumId}/photos` : '/photos';
      const response = await api.get(endpoint, {
        params: {
          page: pageNum,
          limit: 20
        },
        signal: abortController.signal
      });

      if (!isMounted.current) return;

      console.log('Received photos:', response.data);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setPhotos(prevPhotos => {
        if (pageNum === 1) {
          return response.data;
        }
        return [...prevPhotos, ...response.data];
      });
      
      setHasMore(response.data.length === 20);
      setPage(pageNum);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Failed to fetch photos:', error);
      setError('Failed to load photos. Please try again.');
      setHasMore(false);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [albumId]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial photos fetch');
    if (isMounted.current) {
      fetchPhotos(1);
    }
    return () => {
      if (currentRequest.current) {
        currentRequest.current.abort();
      }
    };
  }, [albumId, fetchPhotos]);

  // Load more handler with debounce
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPhotos(page + 1);
    }
  }, [loading, hasMore, page, fetchPhotos]);

  const handleFavorite = async (photoId) => {
    try {
      const photoToUpdate = photos.find(p => p._id === photoId);
      const isAddingToFavorites = !photoToUpdate?.favorite;
      
      // Toggle the favorite status immediately in UI with animation
      setPhotos(photos.map(photo => 
        photo._id === photoId 
          ? { ...photo, favorite: !photo.favorite, animatingFavorite: true }
          : photo
      ));

      if (fullViewPhoto?._id === photoId) {
        setFullViewPhoto(prev => ({ 
          ...prev, 
          favorite: !prev.favorite,
          animatingFavorite: true 
        }));
      }

      // Show toast notification only when adding to favorites
      if (isAddingToFavorites) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      // Make API call to persist the change
      const response = await api.post(`/photos/${photoId}/favorite`);
      
      // Update the photo with the response data to ensure we have the latest state
      const updatedPhoto = response.data;
      setPhotos(photos.map(photo => 
        photo._id === photoId 
          ? { 
              ...photo, 
              ...updatedPhoto,
              favorite: updatedPhoto.favorite,
              animatingFavorite: true 
            }
          : photo
      ));

      // Remove animation class after animation completes
      setTimeout(() => {
        setPhotos(photos.map(photo => 
          photo._id === photoId 
            ? { ...photo, animatingFavorite: false }
            : photo
        ));

        if (fullViewPhoto?._id === photoId) {
          setFullViewPhoto(prev => ({ 
            ...prev, 
            animatingFavorite: false 
          }));
        }
      }, 300);

    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      // Revert the optimistic update if the API call fails
      setPhotos(photos.map(photo => 
        photo._id === photoId 
          ? { ...photo, favorite: photo.favorite, animatingFavorite: false }
          : photo
      ));
      if (fullViewPhoto?._id === photoId) {
        setFullViewPhoto(prev => ({ 
          ...prev, 
          favorite: prev.favorite,
          animatingFavorite: false 
        }));
      }
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(photos.filter(photo => photo._id !== photoId));
      
      // Close full view and details if the deleted photo was being viewed
      if (fullViewPhoto?._id === photoId) {
        setFullViewPhoto(null);
        setSelectedPhoto(null);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  const handleShowDetails = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleCloseDetails = () => {
    setSelectedPhoto(null);
  };

  const handleFullView = (photo) => {
    setFullViewPhoto(photo);
  };

  const handleCloseFullView = () => {
    setFullViewPhoto(null);
    setSelectedPhoto(null); // Close sidebar when closing full view
  };

  const handleUpdatePhoto = async (photoId, updates) => {
    try {
      const response = await api.patch(`/photos/${photoId}`, updates);
      const updatedPhoto = response.data;
      
      setPhotos(photos.map(photo => 
        photo._id === photoId ? { ...photo, ...updatedPhoto } : photo
      ));

      // Update fullViewPhoto if it's the same photo
      if (fullViewPhoto?._id === photoId) {
        setFullViewPhoto(prev => ({ ...prev, ...updatedPhoto }));
      }
    } catch (error) {
      console.error('Failed to update photo:', error);
    }
  };

  return (
    <div className="photos-container">
      {photos.length === 0 && loading ? (
        <div className="photos-loading">
          <div className="loading-spinner"></div>
          <p>Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="photos-empty">
          <span className="material-icons">photo_library</span>
          <h2>No photos yet</h2>
          <p>Upload some photos to see them here</p>
        </div>
      ) : (
        <>
          <div className="date-divider">
            Today
          </div>
          <div className="photos-grid">
            {photos.map((photo) => (
              <PhotoItem
                key={photo._id}
                photo={photo}
                onFavorite={handleFavorite}
                onDelete={handleDelete}
                onShowDetails={handleShowDetails}
                onFullView={handleFullView}
                loading={loading}
              />
            ))}
          </div>
          {hasMore && (
            <div className="load-more">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="load-more-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
      {fullViewPhoto && (
        <div className={`full-view-container ${selectedPhoto ? 'with-sidebar' : ''}`}>
          <FullViewPhoto
            photo={fullViewPhoto}
            onClose={handleCloseFullView}
            onFavorite={handleFavorite}
            onDelete={handleDelete}
            onShowDetails={handleShowDetails}
            showingInfo={selectedPhoto?._id === fullViewPhoto._id}
          />
          {selectedPhoto && (
            <PhotoDetails
              photo={selectedPhoto}
              onClose={handleCloseDetails}
              onUpdate={handleUpdatePhoto}
            />
          )}
        </div>
      )}

      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="material-icons">star</span>
            <span>Added to favorites</span>
            <div className="toast-actions">
              <button onClick={() => setShowToast(false)}>Dismiss</button>
              <button onClick={() => {
                setShowToast(false);
                window.location.href = '/favorites';
              }}>View favorites</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Photos; 