import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:6006";

function Favorites() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API}/api/photos`);
      const favs = res.data.filter(photo => photo.favorite);
      setPhotos(favs);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  };

  const toggleFavorite = async (id) => {
    await axios.post(`${API}/api/photos/favorite/${id}`);
    fetchFavorites();
  };

  const deletePhoto = async (id) => {
    await axios.delete(`${API}/api/photos/${id}`);
    fetchFavorites();
  };

  return (
    <div>
      <h2>⭐ Favorite Photos</h2>
      {photos.length === 0 ? <p>No favorite photos yet.</p> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {photos.map(photo => (
            <div key={photo._id} style={{ width: 200, border: "1px solid #ccc", padding: 10 }}>
              <img src={`${API}/uploads/${photo.filename}`} alt="" style={{ width: "100%", height: 150, objectFit: "cover" }} />
              <p>{photo.title || photo.originalname}</p>
              <button onClick={() => toggleFavorite(photo._id)}>★</button>
              <button onClick={() => deletePhoto(photo._id)} style={{ marginLeft: 10 }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
