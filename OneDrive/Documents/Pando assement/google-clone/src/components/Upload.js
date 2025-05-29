import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:6006";

function Upload() {
  const [files, setFiles] = useState([]);
  const [titles, setTitles] = useState({});
  const [tags, setTags] = useState({});

  const handleUpload = async () => {
    const formData = new FormData();
    Array.from(files).forEach((file, i) => {
      formData.append("photos", file);
      formData.append("titles", titles[i] || "");
      formData.append("tags", tags[i] || "");
    });

    try {
      await axios.post(`${API}/api/photos/upload`, formData);
      alert("Upload successful!");
      setFiles([]);
      setTitles({});
      setTags({});
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div>
      <h2>Upload Photos</h2>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
      {files.map((file, i) => (
        <div key={i}>
          <p>{file.name}</p>
          <input
            type="text"
            placeholder="Title"
            onChange={(e) => setTitles(prev => ({ ...prev, [i]: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Tags"
            onChange={(e) => setTags(prev => ({ ...prev, [i]: e.target.value }))}
          />
        </div>
      ))}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default Upload;
