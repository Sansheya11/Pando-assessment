import * as React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Albums from "./components/Albums";
import Photos from "./components/Photos";
import Favorites from "./components/Favorites";
import Sidebar from "./components/Sidebar";
import Upload from "./components/Upload";
import Search from "./components/Search";
import AlbumView from './components/AlbumView';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <header className="header">
            <div className="header-left">
              <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span className="material-icons">menu</span>
              </button>
              <h1 className="app-title">Photos</h1>
            </div>
            <Search />
            <div className="header-right">
              <Upload />
            </div>
          </header>

          <main className="content">
            <Routes>
              <Route path="/" element={<Photos />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/albums/:albumId" element={<AlbumView />} />
              <Route path="/favorites" element={<Favorites />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
