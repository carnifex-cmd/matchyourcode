const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get the auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchProblems = async (page = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems?page=${page}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch problems');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching problems:', error);
    throw error;
  }
};

export const updateProblemState = async (problemId, state) => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems/${problemId}/state`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(state)
    });
    if (!response.ok) {
      throw new Error('Failed to update problem state');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating problem state:', error);
    throw error;
  }
};

export const fetchProblemById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch problem');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching problem:', error);
    throw error;
  }
};