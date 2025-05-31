import React, { useState, useEffect, useRef } from 'react';
import './Photos.css';

const PhotoItem = React.memo(({ photo, onFavorite, onDelete, onShowDetails, onFullView, loading }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.error('Failed to load image:', photo.url);
    setImageError(true);
    setImageLoaded(true);
    e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found';
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!loading) {
      onFavorite(photo._id);
    }
  };

  return (
    <div 
      className="photo-item"
      onClick={() => !loading && onFullView(photo)}
    >
      <div className="photo-wrapper">
        {!imageLoaded && !imageError && (
          <div className="loading-spinner" />
        )}
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.title || 'Photo'}
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
            title="Show details"
          >
            <span className="material-icons">info</span>
          </button>
          <button
            className={`photo-action favorite ${photo.favorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            disabled={loading}
            title={photo.favorite ? 'Remove from favorites' : 'Add to favorites'}
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
            title="Delete photo"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>
      {photo.title && (
        <div className="photo-title">
          {photo.title}
        </div>
      )}
    </div>
  );
});

export default PhotoItem; 