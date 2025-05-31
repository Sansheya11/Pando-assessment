import * as React from 'react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Albums.module.css";

const API = "http://localhost:9001/api";

function Albums() {
  const [albums, setAlbums] = useState([]);
  const [albumName, setAlbumName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API}/albums`);
      setAlbums(response.data);
    } catch (error) {
      setError("Failed to fetch albums");
      console.error("Failed to fetch albums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlbum = async () => {
    if (!albumName.trim()) {
      setError("Please enter album name");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await axios.post(`${API}/albums`, { name: albumName.trim() });
      setAlbumName("");
      await fetchAlbums();
    } catch (error) {
      setError("Failed to create album");
      console.error("Failed to create album:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      createAlbum();
    }
  };

  return (
    <div className={styles.albumsContainer}>
      <h2 className={styles.title}>My Albums</h2>

      {/* Create new album */}
      <div className={styles.createAlbum}>
        <input
          type="text"
          placeholder="Enter album name"
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.input}
          disabled={isLoading}
        />
        <button 
          onClick={createAlbum} 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Album'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Albums grid */}
      {isLoading && albums.length === 0 ? (
        <div className={styles.loading}>Loading albums...</div>
      ) : albums.length === 0 ? (
        <p className={styles.noAlbums}>No albums yet. Create your first album!</p>
      ) : (
        <div className={styles.albumGrid}>
          {albums.map((album) => (
            <div
              key={album._id}
              className={styles.albumCard}
              onClick={() => navigate(`/albums/${album._id}`)}
            >
              <div className={styles.albumPreview}>
                {album.photos && album.photos.length > 0 ? (
                  <img 
                    src={album.photos[0].url} 
                    alt={album.name}
                    className={styles.previewImage}
                  />
                ) : (
                  <div className={styles.emptyPreview}>
                    No photos
                  </div>
                )}
              </div>
              <div className={styles.albumInfo}>
                <h3 className={styles.albumName}>{album.name}</h3>
                <span className={styles.photoCount}>
                  {album.photos?.length || 0} photos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Albums;
