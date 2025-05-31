import React, { useState, useEffect } from 'react';
import './InfoSidebar.css';

// Common tag suggestions
const COMMON_TAGS = [
  'nature', 'portrait', 'landscape', 'urban', 'travel'
];

const InfoSidebar = ({ photo, onUpdatePhoto, isOpen, onToggle }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (photo) {
      setTitle(photo.title || '');
      setDescription(photo.description || '');
      setTags(photo.tags || []);
    }
  }, [photo]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdatePhoto({
      ...photo,
      title: newTitle
    });
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onUpdatePhoto({
      ...photo,
      description: newDescription
    });
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      onUpdatePhoto({
        ...photo,
        tags: updatedTags
      });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onUpdatePhoto({
      ...photo,
      tags: updatedTags
    });
  };

  const handleSuggestionClick = (tag) => {
    if (!tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      onUpdatePhoto({
        ...photo,
        tags: updatedTags
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`info-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="info-sidebar-header">
        <button className="close-button" onClick={onToggle}>
          <span className="material-icons">close</span>
        </button>
        <h2>Info</h2>
        <button className="edit-button">
          <span className="material-icons">edit</span>
        </button>
      </div>

      <div className="info-sidebar-content">
        <div className="info-section">
          <div className="section-label">TITLE</div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Add a title"
            className="title-input"
          />
        </div>

        <div className="info-section">
          <div className="section-label">DESCRIPTION</div>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Add a description"
            className="description-input"
          />
        </div>

        <div className="info-section">
          <div className="section-label">TAGS</div>
          <div className="tags-wrapper">
            <div className="tags-container">
              {tags.map((tag, index) => (
                <div key={index} className="tag">
                  {tag}
                  <button 
                    className="remove-tag" 
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="add-tag-form">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="tag-input"
              />
              <button type="submit" className="add-tag-button">
                +
              </button>
            </form>
          </div>

          {COMMON_TAGS.length > 0 && (
            <div className="suggested-tags">
              <div className="suggestion-label">Suggested tags:</div>
              <div className="tag-suggestions">
                {COMMON_TAGS.filter(tag => !tags.includes(tag)).map((tag) => (
                  <button
                    key={tag}
                    className="tag-suggestion"
                    onClick={() => handleSuggestionClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="section-label">UPLOAD DATE</div>
          <div className="info-text">{formatDate(photo?.createdAt)}</div>
        </div>

        <div className="info-section">
          <div className="section-label">LAST MODIFIED</div>
          <div className="info-text">{formatDate(photo?.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};

export default InfoSidebar;
