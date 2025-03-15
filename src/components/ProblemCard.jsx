import React from 'react';
import './ProblemCard.css';

const ProblemCard = ({ problem, onSwipe, view }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'Hard':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  return (
    <div className="problem-card">
      <div className="card-content">
        <div className="card-header">
          <span 
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
          >
            {problem.difficulty}
          </span>
          <span className="topic-badge">{problem.topic}</span>
        </div>
        <h3 className="problem-title">
          {problem.titleSlug ? (
            <a 
              href={`https://leetcode.com/problems/${problem.titleSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {problem.title}
            </a>
          ) : (
            problem.title
          )}
        </h3>
        
        {view === 'problems' && (
          <div className="card-actions">
            <button 
              className="action-button need-to-learn"
              onClick={() => onSwipe('toLearn', problem)}
            >
              Need to Learn
            </button>
            <button 
              className="action-button know-it"
              onClick={() => onSwipe('toRevise', problem)}
            >
              Know It!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;