import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ filters, onFilterChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // Also update main content margin
    document.querySelector('.main-content').classList.toggle('sidebar-collapsed');
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const topics = ['Array', 'Linked List', 'Tree', 'Hash Table', 'String', 'D.P.', 'Math', 'Depth-First Search', 'Binary Search', 'Two Pointers'];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-button" 
        onClick={toggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="filter-section">
        <h3>Difficulty</h3>
        {difficulties.map((difficulty) => (
          <label key={difficulty} className="filter-label">
            <input
              type="checkbox"
              checked={filters.difficulties.includes(difficulty)}
              onChange={(e) => {
                const newDifficulties = e.target.checked
                  ? [...filters.difficulties, difficulty]
                  : filters.difficulties.filter(d => d !== difficulty);
                onFilterChange('difficulties', newDifficulties);
              }}
            />
            {difficulty}
          </label>
        ))}
      </div>
      
      <div className="filter-section">
        <h3>Topics</h3>
        {topics.map((topic) => (
          <label key={topic} className="filter-label">
            <input
              type="checkbox"
              checked={filters.topics.includes(topic)}
              onChange={(e) => {
                const newTopics = e.target.checked
                  ? [...filters.topics, topic]
                  : filters.topics.filter(t => t !== topic);
                onFilterChange('topics', newTopics);
              }}
            />
            {topic}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;