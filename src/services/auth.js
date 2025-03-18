const API_BASE_URL = 'https://matchyourcode.onrender.com/api'; //http://localhost:8000/api
// const API_BASE_URL = 'http://localhost:8000/api'; 
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message;
      } catch (e) {
        errorMessage = 'Failed to parse error response';
      }
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login successful');
    return data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

export const register = async (username, email, password) => {
  try {
    console.log('Attempting registration with:', { email, username });
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    console.log('Registration response status:', response.status);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message;
      } catch (e) {
        errorMessage = 'Failed to parse error response';
      }
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Registration successful');
    return data;
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};