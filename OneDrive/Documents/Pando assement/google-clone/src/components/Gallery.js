import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const API = "http://localhost:6006";

function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${API}/api/photos`);
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPhotos(sorted);
      setFilteredPhotos(sorted);
    } catch (error) {
      console.error("Failed to fetch photos:", error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await axios.get(`${API}/api/albums`);
      setAlbums(res.data);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    if (!q.trim()) {
      setFilteredPhotos(photos);
      return;
    }

    const filtered = photos.filter((photo) => {
      const titleMatch = photo.title?.toLowerCase().includes(q);
      const tagsMatch = photo.tags?.some((tag) => tag.toLowerCase().includes(q));
      const albumMatch = albums.some(
        (album) => album._id === photo.albumId && album.name.toLowerCase().includes(q)
      );
      return titleMatch || tagsMatch || albumMatch;
    });

    setFilteredPhotos(filtered);
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.post(`${API}/api/photos/favorite/${id}`);
      fetchPhotos();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const deletePhoto = async (id) => {
    try {
      await axios.delete(`${API}/api/photos/${id}`);
      fetchPhotos();
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  const addToAlbum = async (albumId, photoId) => {
    if (!albumId) return;
    try {
      await axios.post(`${API}/api/albums/${albumId}/add`, { photoId });
      alert("Photo added to album");
    } catch (error) {
      console.error("Failed to add photo to album:", error);
    }
  };

  const groupPhotosByDate = (photos) => {
    return photos.reduce((groups, photo) => {
      const date = dayjs(photo.createdAt).format("MMMM D, YYYY");
      if (!groups[date]) groups[date] = [];
      groups[date].push(photo);
      return groups;
    }, {});
  };

  const groupedPhotos = groupPhotosByDate(filteredPhotos);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Gallery (Timeline View)</h2>
        <input
          type="text"
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: 6,
            width: 250,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Timeline view */}
      {Object.keys(groupedPhotos).map((date) => (
        <div key={date} style={{ marginBottom: 30 }}>
          <h3 style={{ marginBottom: 10 }}>{date}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {groupedPhotos[date].map((photo) => (
              <div
                key={photo._id}
                style={{
                  border: "1px solid #ccc",
                  padding: 10,
                  width: 220,
                  borderRadius: 6,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={`${API}/uploads/${photo.filename}`}
                  alt={photo.originalname}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <strong style={{ flexGrow: 1 }}>{photo.title || "Untitled"}</strong>
                  <button
                    onClick={() => toggleFavorite(photo._id)}
                    style={{
                      fontSize: 20,
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      color: photo.favorite ? "gold" : "#ccc",
                    }}
                  >
                    {photo.favorite ? "★" : "☆"}
                  </button>
                  <button
                    onClick={() => deletePhoto(photo._id)}
                    style={{
                      fontSize: 20,
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      color: "red",
                    }}
                  >
                    🗑️
                  </button>
                </div>

                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Tags: {photo.tags?.join(", ") || "None"}
                </p>

                <div style={{ marginTop: 10 }}>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      addToAlbum(e.target.value, photo._id);
                      e.target.value = "";
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="">Add to Album</option>
                    {albums.map((album) => (
                      <option key={album._id} value={album._id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Gallery;
