import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ProblemCard from './ProblemCard';
import { fetchProblems, updateProblemState } from '../services/api';

const Problems = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getFilteredProblems = (problems = []) => {
    if (!problems || !Array.isArray(problems)) return [];
    return problems.filter(problem => {
      if (!problem || !problem.difficulty || !problem.topic) return false;
      const matchesDifficulty = filters?.difficulties?.includes(problem.difficulty) ?? false;
      const matchesTopic = filters?.topics?.includes(problem.topic) ?? false;
      return matchesDifficulty && matchesTopic;
    });
  };

  const getAvailableCards = () => {
    const problems = (() => {
      switch (activeView) {
        case 'toLearn':
          return getFilteredProblems(toLearn);
        case 'toRevise':
          return getFilteredProblems(toRevise);
        default:
          return getFilteredProblems(currentProblems);
      }
    })();
    
    if (!problems || problems.length === 0) return [];
    if (currentIndex >= problems.length) {
      setCurrentIndex(0);
      return [problems[0]];
    }
    return [problems[currentIndex]];
  };

  const [filters, setFilters] = useState({
    difficulties: ['Easy', 'Medium', 'Hard'],
    topics: ['Array', 'Linked List', 'Tree', 'Hash Table', 'String', 'D.P.', 'Math', 'Depth-First Search', 'Binary Search', 'Two Pointers']
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentProblemId, setCurrentProblemId] = useState(null);

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
      
      // Preserve current problem ID and index before updating state
      const availableCards = getAvailableCards();
      const currentProblem = availableCards[0];
      const preservedId = currentProblem ? currentProblem.id : currentProblemId;
      
      if (page === 1) {
        console.log('Setting initial state:', { problems, toLearn, toRevise });
        // Insert new problems after current card instead of appending to end
        setCurrentProblems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProblems = problems.filter(p => !existingIds.has(p.id));
          
          if (currentIndex >= 0 && currentIndex < prev.length) {
            // Insert after current card
            const before = prev.slice(0, currentIndex + 1);
            const after = prev.slice(currentIndex + 1);
            return [...before, ...newProblems, ...after];
          } else {
            // If no current card, append to end
            return [...prev, ...newProblems];
          }
        });
        setToLearn(toLearn);
        setToRevise(toRevise);
        
        // Update current problem ID and index
        if (preservedId) {
          const newIndex = problems.findIndex(p => p.id === preservedId);
          if (newIndex !== -1) {
            setCurrentIndex(newIndex);
            setCurrentProblemId(preservedId);
          }
        }
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
    const initializeProblems = async () => {
      try {
        const response = await fetchProblems(1);
        const { problems = [], toLearn = [], toRevise = [], pagination = {}, user } = response;
        
        // Set the current index based on lastViewedProblemId
        if (user?.lastViewedProblemId) {
          // First check in the main problems list
          let problemIndex = problems.findIndex(p => p.id === user.lastViewedProblemId);
          
          // If not found in problems, check in toLearn and toRevise lists
          if (problemIndex === -1) {
            const problem = [...toLearn, ...toRevise].find(p => p.id === user.lastViewedProblemId);
            if (problem) {
              // If found in other lists, start with the first problem in main list
              problemIndex = 0;
            }
          }
          
          if (problemIndex !== -1) {
            setCurrentIndex(problemIndex);
            setCurrentProblemId(problems[problemIndex].id);
          }
        }

        setCurrentProblems(problems);
        setToLearn(toLearn);
        setToRevise(toRevise);
        setHasMore(pagination.hasMore || false);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error initializing problems:', error);
        setError('Failed to load problems. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    initializeProblems();
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
    // Update the current problems list immediately
    setCurrentProblems(prev => prev.filter(p => p.id !== problem.id));
    
    // Get the updated filtered problems
    const remainingProblems = getFilteredProblems(currentProblems.filter(p => p.id !== problem.id));
    
    // Update the current index based on remaining problems
    if (remainingProblems.length > 0) {
      const newIndex = currentIndex >= remainingProblems.length ? 0 : currentIndex;
      setCurrentIndex(newIndex);
      // Update current problem ID
      const nextProblemId = remainingProblems[newIndex].id;
      setCurrentProblemId(nextProblemId);
    }
    
    try {
      const timestamp = Date.now();
      const nextProblem = remainingProblems.length > 0 ? remainingProblems[currentIndex] : null;
      
      // Update the current problem state and last viewed problem
      await updateProblemState(problem.id, {
        status: direction,
        lastShown: timestamp,
        revisionCount: direction === 'toLearn' ? 0 : (problem.revisionCount || 0) + 1,
        lastViewedProblemId: nextProblem ? nextProblem.id : null
      });
      
      // Update current problem ID
      if (nextProblem) {
        setCurrentProblemId(nextProblem.id);
      }


      // Update local state based on direction
      if (direction === 'toLearn') {
        setToLearn(prev => [...prev, problem]);
      } else if (direction === 'toRevise') {
        setToRevise(prev => [...prev, problem]);
      }

      // Load more problems if needed
      if (remainingProblems.length === 0 && hasMore) {
        setCurrentPage(prev => prev + 1);
        await loadProblems(false, currentPage + 1);
      }
    } catch (error) {
      console.error('Error updating problem state:', error);
      // Revert the local state changes
      setCurrentProblems(prev => [...prev, problem]);
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

        <div className={`cards-container ${refreshing ? 'refreshing' : ''}`}>
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