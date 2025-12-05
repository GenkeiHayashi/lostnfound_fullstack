import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // Used for making API calls to your backend

// 1. Create the Context object
const AuthContext = createContext(null);

// Placeholder for your backend authentication URL
// Update API_URL to use HTTPS and the correct path for login.
// Replace 'yourdomain.com' with your actual domain name once deployed. 
// For local development, use http://localhost:3000
const API_URL = 'https://losthub-backend.vercel.app/api/auth'; 
const LOGIN_API_URL = `${API_URL}/login`; // Will be the POST endpoint

export const AuthProvider = ({ children }) => {
  // State variables for tracking authentication status
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // Key for authorization: 'user' or 'admin'
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Check (Runs once when the app loads) ---
  useEffect(() => {
    // Check if we have stored credentials (token and role) from a previous session
    const token = sessionStorage.getItem('authToken');
    const storedRole = sessionStorage.getItem('userRole');

    if (token && storedRole) {
      
      // --- Token Verification ---
      // We use a simple GET request to verify the stored token is still valid
      axios.get(`${API_URL}/verify-token`, { headers: { Authorization: `Bearer ${token}` }})
        .then(response => {
          // If the token is valid, the backend should return user data including the role
          setUser(response.data.user); 
          setRole(response.data.user.role);
          setIsAuthenticated(true);
        })
        .catch(() => {
          logout(); // Token failed verification or expired
        })
        .finally(() => setIsLoading(false));
      
    } else {
        // Only call this if no token was found
        setIsLoading(false); 
    }
  }, []);

  // --- Login Function ---
  const login = async (email, password) => {
    setIsLoading(true);
    
    // --- Login Request ---
    try {
      // Make the actual request to your backend login route (now using POST)
      const response = await axios.post(LOGIN_API_URL, { email, password });
      
      // Expect token, user object, and role from the backend
      const { token, user } = response.data;
      
      // CRUCIAL: Store the token and the role
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('userRole', user.role); // Store the actual role ('user' or 'admin')
      
      setUser(user);
      setRole(user.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log(`[AUTH] Logging in as User: ${user.displayName || user.email} // Role: ${user.role}`);
      return true; // Success

    } catch (error) {
      // Catch network or server-side errors and extract the error message
      const errorMessage = error.response?.data?.message || 'Login failed. Network error or server down.';
      return errorMessage; 
    } finally {
      setIsLoading(false);
    }
  };

    // --- Logout Function ---
  const logout = () => {
    // Clear storage and reset state
    sessionStorage.removeItem('authToken'); 
    sessionStorage.removeItem('userRole');
    
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  // The object that makes the state and functions available to the app
  const contextValue = {
    user,
    isAuthenticated,
    role,
    isLoading,
    login,
    logout,
    token: sessionStorage.getItem('authToken'), // Retrieves token from session storage
  };

  // If the initial check is running, display a loading screen
  if (isLoading) {
    return <h1>Hang tight! Good things are worth the wait. Don't lose hope!</h1>; 
  }


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext easily in any component
export const useAuth = () => {
  return useContext(AuthContext);
};