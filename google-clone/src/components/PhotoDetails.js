import * as React from 'react';
import { useState } from 'react';
import './PhotoDetails.css';

function PhotoDetails({ photo, onClose, onUpdate, onUpload }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(photo?.title || '');
  const [description, setDescription] = useState(photo?.description || '');
  const [tags, setTags] = useState(photo?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(photo._id, { title, description, tags });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update photo:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className={`photo-details-sidebar ${isEditing ? 'editing' : ''}`}>
      <div className="photo-details-header">
        <button className="close-button" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
        <h2>Info</h2>
        <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
          <span className="material-icons">{isEditing ? 'done' : 'edit'}</span>
        </button>
      </div>

      <div className="photo-details-content">
        {photo ? (
          <div className="photo-preview">
            <img 
              src={photo.url} 
              alt={photo.title || 'Photo'} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
              }}
            />
          </div>
        ) : (
          <div className="photo-upload-placeholder">
            <span className="material-icons">cloud_upload</span>
            <h3>No photos yet</h3>
            <p>Upload some photos to see them here</p>
            <label className="upload-button" htmlFor="photo-upload">
              <span className="material-icons">add_photo_alternate</span>
              Upload Photos
            </label>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              multiple
              onChange={onUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        <div className="photo-details-section">
          <div className="activity-section">
            <span className="material-icons">schedule</span>
            <div className="activity-info">
              <span className="activity-date">{formatDate(photo.createdAt)}</span>
              <span className="activity-location">{photo.location || 'No location'}</span>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title"
                  className="title-input"
                />
              </div>
              <div className="form-group">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description"
                  rows={3}
                  className="description-input"
                />
              </div>
              <div className="form-group">
                <h3>Tags</h3>
                <div className="tag-input-container">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button type="button" onClick={addTag} className="add-tag-button">
                    <span className="material-icons">add</span>
                  </button>
                </div>
                <div className="tags-list">
                  {tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="remove-tag">
                        <span className="material-icons">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <>
              {(title || description || tags.length > 0) && (
                <div className="text-content">
                  {title && <h3>{title}</h3>}
                  {description && <p>{description}</p>}
                  {tags.length > 0 && (
                    <div className="tags-section">
                      <h3>Tags</h3>
                      <div className="tags-list">
                        {tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="photo-details-section">
          <h3>People</h3>
          <div className="people-section">
            <div className="face-detection-prompt">
              <span className="material-icons">face</span>
              <p>{photo.faces ? `${photo.faces.length} faces available to add` : 'No faces detected'}</p>
            </div>
          </div>
        </div>

        <div className="photo-details-section">
          <h3>Photo Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Name</span>
              <span className="value">{photo.originalname}</span>
            </div>
            <div className="detail-item">
              <span className="label">Size</span>
              <span className="value">{formatFileSize(photo.size)}</span>
            </div>
            {photo.dimensions && (
              <div className="detail-item">
                <span className="label">Dimensions</span>
                <span className="value">{`${photo.dimensions.width} × ${photo.dimensions.height}`}</span>
              </div>
            )}
            {photo.exif && (
              <>
                {photo.exif.make && (
                  <div className="detail-item">
                    <span className="label">Camera</span>
                    <span className="value">{`${photo.exif.make} ${photo.exif.model}`}</span>
                  </div>
                )}
                {photo.exif.focalLength && (
                  <div className="detail-item">
                    <span className="label">Focal Length</span>
                    <span className="value">{photo.exif.focalLength}</span>
                  </div>
                )}
                {photo.exif.aperture && (
                  <div className="detail-item">
                    <span className="label">Aperture</span>
                    <span className="value">{photo.exif.aperture}</span>
                  </div>
                )}
                {photo.exif.shutterSpeed && (
                  <div className="detail-item">
                    <span className="label">Shutter Speed</span>
                    <span className="value">{photo.exif.shutterSpeed}</span>
                  </div>
                )}
                {photo.exif.iso && (
                  <div className="detail-item">
                    <span className="label">ISO</span>
                    <span className="value">{photo.exif.iso}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoDetails; 