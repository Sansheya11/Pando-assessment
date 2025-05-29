import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Upload from "./components/Upload";
import Gallery from "./components/Gallery";
import Albums from "./components/Albums";
import AlbumView from "./pages/AlbumView";
import Favorites from "./components/Favorites"; 

function navStyle(isActive) {
  return {
    textDecoration: "none",
    color: isActive ? "#0d6efd" : "#333",
    fontWeight: isActive ? "bold" : "normal",
  };
}

function App() {
  return (
    <Router>
      <div className="app-layout" style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: "220px",
            background: "#f4f4f4",
            padding: "20px",
            borderRight: "1px solid #ddd",
          }}
        >
          <h2 style={{ marginBottom: "30px" }}>📷 My Photos</h2>
          <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => navStyle(isActive)}
            >
              📸 Gallery
            </NavLink>
            <NavLink
              to="/upload"
              style={({ isActive }) => navStyle(isActive)}
            >
              ⬆️ Upload
            </NavLink>
            <NavLink
              to="/albums"
              style={({ isActive }) => navStyle(isActive)}
            >
              🏷️ Albums
            </NavLink>
            <NavLink
              to="/favorites"
              style={({ isActive }) => navStyle(isActive)}
            >
              ⭐ Favorites
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flexGrow: 1, padding: "20px", overflowY: "auto" }}>
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/albums/:albumId" element={<AlbumView />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
