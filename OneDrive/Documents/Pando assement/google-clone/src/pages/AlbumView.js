import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:6006";

function AlbumView() {
  const { albumId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [albumName, setAlbumName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbumPhotos();
  }, [albumId]);

  const fetchAlbumPhotos = async () => {
    try {
      const res = await axios.get(`${API}/api/albums/${albumId}/photos`);
      setPhotos(res.data.photos || res.data); // Adjust based on backend response shape
      setAlbumName(res.data.name || "Album");
    } catch (error) {
      console.error("Failed to fetch album photos:", error);
    }
  };

  const removeFromAlbum = async (photoId) => {
    try {
      await axios.post(`${API}/api/albums/${albumId}/remove`, { photoId });
      fetchAlbumPhotos();
    } catch (error) {
      console.error("Failed to remove photo from album:", error);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/albums")}
        style={{
          marginBottom: 20,
          padding: "6px 12px",
          cursor: "pointer",
          borderRadius: 4,
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
        }}
      >
        ← Back to Albums
      </button>

      <h2>{albumName}</h2>

      {photos.length === 0 ? (
        <p>No photos in this album.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {photos.map((photo) => (
            <div
              key={photo._id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                width: 180,
                borderRadius: 6,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={`${API}/uploads/${photo.filename}`}
                alt={photo.originalname}
                style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 4 }}
              />
              <p style={{ marginTop: 8, fontWeight: "bold" }}>
                {photo.title || "Untitled"}
              </p>
              <button
                onClick={() => removeFromAlbum(photo._id)}
                style={{
                  backgroundColor: "#ff4d4d",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Remove from Album
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlbumView;
