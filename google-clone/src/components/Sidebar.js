import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen }) {
  const menuItems = [
    {
      to: '/',
      icon: 'photo_library',
      label: 'Photos'
    },
    {
      to: '/favorites',
      icon: 'favorite_border',
      label: 'Favorites'
    },
    {
      to: '/albums',
      icon: 'photo_album',
      label: 'Albums'
    }
  ];

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default Sidebar; 