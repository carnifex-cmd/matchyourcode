import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ProblemCard from './ProblemCard';
import { fetchProblems, updateProblemState } from '../services/api';

const Problems = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    difficulties: ['Easy', 'Medium', 'Hard'],
    topics: ['Arrays', 'LinkedLists', 'Trees']
  });

  const [currentProblems, setCurrentProblems] = useState([]);
  const [toLearn, setToLearn] = useState([]);
  const [toRevise, setToRevise] = useState([]);
  const [activeView, setActiveView] = useState('problems');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch problems from backend
  const loadProblems = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const response = await fetchProblems();
      setCurrentProblems(response.problems || []);
      setToLearn(response.toLearn || []);
      setToRevise(response.toRevise || []);
      setError(null);
    } catch (err) {
      setError('Failed to load problems. Please try again later.');
      console.error('Error loading problems:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProblems();
  }, []);

  // Refresh problems every 10 seconds to update countdown
  useEffect(() => {
    const intervalId = setInterval(() => loadProblems(true), 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSwipe = async (direction, problem) => {
    try {
      const timestamp = Date.now();
      const newState = {
        status: direction === 'toLearn' ? 'toLearn' : 'toRevise',
        lastShown: timestamp,
        revisionCount: direction === 'toLearn' ? 0 : (problem.revisionCount || 0) + 1
      };

      // Update the state in the backend
      await updateProblemState(problem.id, newState);
      
      // Refresh problems to get the updated state
      await loadProblems();
    } catch (error) {
      console.error('Failed to update problem state:', error);
      setError('Failed to update problem state. Please try again.');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading problems...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const getFilteredProblems = (problems) => {
    return problems.filter(problem => 
      filters.difficulties.includes(problem.difficulty) &&
      filters.topics.includes(problem.topic)
    );
  };

  const getAvailableCards = () => {
    switch (activeView) {
      case 'toLearn':
        return getFilteredProblems(toLearn);
      case 'toRevise':
        return getFilteredProblems(toRevise);
      default:
        return getFilteredProblems(currentProblems);
    }
  };

  return (
    <div className="app">
      <Sidebar filters={filters} onFilterChange={handleFilterChange} />
      <main className="main-content">
        <div className="header">
          <h1>MatchYourCode</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        
        <div className="view-controls">
          <button 
            type="button"
            className={`view-button ${activeView === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveView('problems')}
          >
            Problems ({getFilteredProblems(currentProblems).length})
          </button>
          <button 
            type="button"
            className={`view-button ${activeView === 'toLearn' ? 'active' : ''}`}
            onClick={() => setActiveView('toLearn')}
          >
            To Learn ({getFilteredProblems(toLearn).length})
          </button>
          <button 
            type="button"
            className={`view-button ${activeView === 'toRevise' ? 'active' : ''}`}
            onClick={() => setActiveView('toRevise')}
          >
            To Revise ({getFilteredProblems(toRevise).length})
          </button>
        </div>

        {refreshing && <div className="refresh-indicator">Refreshing...</div>}

        <div className="cards-container">
          {getAvailableCards().map((problem) => (
            <ProblemCard 
              key={`${problem.id}-${problem.lastShown}`}
              problem={problem} 
              onSwipe={handleSwipe}
              view={activeView}
            />
          ))}
          {getAvailableCards().length === 0 && (
            <div className="empty-state">
              {activeView === 'problems' && 'No problems available right now. Check back soon!'}
              {activeView === 'toLearn' && 'No problems marked for learning yet.'}
              {activeView === 'toRevise' && 'No problems marked for revision yet.'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Problems; 