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
    topics: ['Array', 'Linked List', 'Tree', 'Hash Table', 'String', 'Dynamic Programming', 'Math', 'Depth-First Search', 'Binary Search', 'Two Pointers']
  });

  const [currentProblems, setCurrentProblems] = useState([]);
  const [toLearn, setToLearn] = useState([]);
  const [toRevise, setToRevise] = useState([]);
  const [activeView, setActiveView] = useState('problems');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch problems from backend
  const loadProblems = async (isRefresh = false, page = 1) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const response = await fetchProblems(page);
      const { problems = [], toLearn = [], toRevise = [], pagination = {} } = response;
      console.log('API Response:', { problems, toLearn, toRevise, pagination });
      if (page === 1) {
        console.log('Setting initial state:', { problems, toLearn, toRevise });
        setCurrentProblems(problems);
        setToLearn(toLearn);
        setToRevise(toRevise);
      } else {
        console.log('Appending to existing state:', { problems, toLearn, toRevise });
        setCurrentProblems(prev => [...prev, ...problems]);
        setToLearn(prev => [...prev, ...toLearn]);
        setToRevise(prev => [...prev, ...toRevise]);
      }
      setHasMore(pagination.hasMore || false);
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
    loadProblems(false, 1);
    setCurrentPage(1);
    console.log('Initial filters state:', filters);
  }, []);

  // Refresh problems every 10 seconds to update countdown
  useEffect(() => {
    console.log('Setting up refresh interval with current page:', currentPage);
    const intervalId = setInterval(() => loadProblems(true, currentPage), 10000);
    return () => clearInterval(intervalId);
  }, [currentPage]);

  const handleFilterChange = (filterType, value) => {
    console.log('Filter change:', { filterType, value });
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };
      console.log('New filters state:', newFilters);
      return newFilters;
    });
  };

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadProblems(false, nextPage);
    }
  };

  if (loading && currentPage === 1) {
    return <div className="loading">Loading problems...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const getFilteredProblems = (problems) => {
    console.log('Filtering problems:', { problems, filters });
    const filtered = problems.filter(problem => {
      const matchesDifficulty = filters.difficulties.includes(problem.difficulty);
      const matchesTopic = filters.topics.includes(problem.topic);
      console.log(`Problem ${problem.title}: difficulty match = ${matchesDifficulty}, topic match = ${matchesTopic}`);
      return matchesDifficulty && matchesTopic;
    });
    console.log('Filtered problems:', filtered);
    return filtered;
  };

  const getAvailableCards = () => {
    const problems = (() => {
      switch (activeView) {
        case 'toLearn':
          console.log('ToLearn view state:', toLearn);
          return getFilteredProblems(toLearn);
        case 'toRevise':
          console.log('ToRevise view state:', toRevise);
          return getFilteredProblems(toRevise);
        default:
          console.log('Current problems state:', currentProblems);
          return getFilteredProblems(currentProblems);
      }
    })();
    console.log('Final filtered problems for view:', problems);
    return problems;
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