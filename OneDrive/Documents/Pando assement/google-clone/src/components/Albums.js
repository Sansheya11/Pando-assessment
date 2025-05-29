import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:6006";

function Albums() {
  const [albums, setAlbums] = useState([]);
  const [albumName, setAlbumName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const res = await axios.get(`${API}/api/albums`);
      setAlbums(res.data);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
    }
  };

  const createAlbum = async () => {
    if (!albumName.trim()) {
      alert("Please enter album name");
      return;
    }
    try {
      await axios.post(`${API}/api/albums`, { name: albumName.trim() });
      setAlbumName("");
      fetchAlbums();
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  const openAlbum = (albumId) => {
    navigate(`/albums/${albumId}`);
  };

  return (
    <div>
      <h2>Albums</h2>

      {/* Create new album */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="New album name"
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          style={{ padding: 6, marginRight: 10, width: 250 }}
        />
        <button onClick={createAlbum} style={{ padding: "6px 12px" }}>
          Add Album
        </button>
      </div>

      {/* Albums list */}
      {albums.length === 0 ? (
        <p>No albums yet</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {albums.map((album) => (
            <li
              key={album._id}
              onClick={() => openAlbum(album._id)}
              style={{
                cursor: "pointer",
                padding: 10,
                border: "1px solid #ccc",
                marginBottom: 10,
                borderRadius: 6,
                backgroundColor: "#fafafa",
              }}
              title="Click to view album"
            >
              {album.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Albums;
