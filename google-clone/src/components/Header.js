import React from "react";

function Header({ searchQuery, setSearchQuery, searchPhotos }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>Google Photos Clone</h1>
      <input
        type="text"
        placeholder="Search photos..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          searchPhotos(e.target.value);
        }}
        style={{ padding: 6, width: 250 }}
      />
    </div>
  );
}

export default Header;
