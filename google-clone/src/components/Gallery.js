import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const API = "http://localhost:9001";

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

  const groupPhotosByTimeline = (photos) => {
    const now = dayjs();
    return photos.reduce((groups, photo) => {
      const photoDate = dayjs(photo.createdAt);
      const minutesSinceUpload = now.diff(photoDate, 'minute');
      
      let timeGroup;
      if (minutesSinceUpload < 15) {
        timeGroup = 'Just now';
      } else if (minutesSinceUpload < 60) {
        timeGroup = `${Math.floor(minutesSinceUpload / 15) * 15} minutes ago`;
      } else if (minutesSinceUpload < 1440) { // Less than 24 hours
        timeGroup = photoDate.fromNow();
      } else {
        timeGroup = photoDate.format('MMMM D, YYYY');
      }

      if (!groups[timeGroup]) {
        groups[timeGroup] = [];
      }
      groups[timeGroup].push(photo);
      return groups;
    }, {});
  };

  const groupedPhotos = groupPhotosByTimeline(filteredPhotos);
  const timeGroups = Object.keys(groupedPhotos).sort((a, b) => {
    if (a === 'Just now') return -1;
    if (b === 'Just now') return 1;
    return dayjs(groupedPhotos[b][0].createdAt) - dayjs(groupedPhotos[a][0].createdAt);
  });

  return (
    <div className="gallery-container" style={{ padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Photo Timeline</h2>
        <input
          type="text"
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: 8,
            width: 250,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: '16px'
          }}
        />
      </div>

      {/* Timeline view */}
      {timeGroups.map((timeGroup) => (
        <div key={timeGroup} className="timeline-group" style={{ marginBottom: 30 }}>
          <h3 style={{ 
            marginBottom: 15,
            padding: '8px 15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {timeGroup}
          </h3>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 20,
            padding: '0 10px'
          }}>
            {groupedPhotos[timeGroup].map((photo) => (
              <div
                key={photo._id}
                className="photo-card"
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer',
                  ':hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={`${API}/uploads/${photo.filename}`}
                    alt={photo.originalname}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'flex',
                    gap: 8,
                    background: 'rgba(255,255,255,0.9)',
                    padding: '4px 8px',
                    borderRadius: 20
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo._id);
                      }}
                      style={{
                        fontSize: 20,
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        color: photo.favorite ? "gold" : "#ccc",
                        padding: 0
                      }}
                    >
                      {photo.favorite ? "★" : "☆"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this photo?')) {
                          deletePhoto(photo._id);
                        }
                      }}
                      style={{
                        fontSize: 20,
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        color: "#ff4444",
                        padding: 0
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ padding: 15 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8
                  }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>
                      {photo.title || "Untitled"}
                    </h4>
                    <small style={{ color: '#666' }}>
                      {dayjs(photo.createdAt).format('HH:mm')}
                    </small>
                  </div>

                  {photo.tags && photo.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginTop: 8 
                    }}>
                      {photo.tags.map(tag => (
                        <span key={tag} style={{
                          backgroundColor: '#f0f0f0',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      addToAlbum(e.target.value, photo._id);
                      e.target.value = "";
                    }}
                    style={{
                      width: "100%",
                      marginTop: 12,
                      padding: "6px",
                      borderRadius: 4,
                      border: "1px solid #ddd"
                    }}
                  >
                    <option value="" disabled>
                      Add to album...
                    </option>
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
