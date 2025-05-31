import * as React from 'react';
import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Upload.css';

function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      // Get the current album ID from the URL if we're in an album
      const albumId = location.pathname.match(/\/albums\/([^/]+)/)?.[1];
      
      // Choose the appropriate endpoint based on context
      const endpoint = albumId ? `/api/albums/${albumId}/photos` : '/api/photos/upload';
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the current view
      if (albumId) {
        // If in album view, stay on the same page
        window.location.reload();
      } else {
        // If in photos view, navigate to photos
        navigate('/');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="upload-container">
      <input
        ref={fileInputRef}
        type="file"
        id="photo-upload"
        multiple
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <label
        htmlFor="photo-upload"
        className={`upload-button ${isUploading ? 'uploading' : ''}`}
      >
        {isUploading ? (
          <div className="upload-progress">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
            <span className="progress-text">{progress}%</span>
          </div>
        ) : (
          <>
            <span className="material-icons">upload</span>
            <span className="upload-text">Upload</span>
          </>
        )}
      </label>
    </div>
  );
}

export default Upload;
