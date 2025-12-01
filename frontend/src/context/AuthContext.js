import React, { createContext, useState, useContext, useEffect } from 'react';
//import axios from 'axios'; // Used for making API calls to your backend, keep comment until set up backend 

// 1. Create the Context object
const AuthContext = createContext(null);

// Placeholder for your backend authentication URL
//const API_URL = 'http://192.168.56.1:3000/api/auth'; 
//const LOGIN_API_URL = 'http://localhost:3000/api/auth/login';

export const AuthProvider = ({ children }) => {
  // State variables for tracking authentication status
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // Key for authorization: 'user' or 'admin'
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Check (Runs once when the app loads) ---
  useEffect(() => {
    // Check if we have stored credentials (token and role) from a previous session
    const token = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');

    if (token && storedRole) {
      // In a real application,make a backend call here to verify the token
      /*
      // --- BACKEND REPLACEMENT ZONE 1 (Token Verification) ---
      axios.get(`${API_URL}/verify-token`, { headers: { Authorization: `Bearer ${token}` }})
        .then(response => {
          setUser(response.data.user); // Get full user data
          setRole(response.data.user.role);
          setIsAuthenticated(true);
        })
        .catch(() => {
          logout(); // Token failed verification
        })
        .finally(() => setIsLoading(false));
      // --- END BACKEND REPLACEMENT ZONE 1 ---
      */

      // *** TESTING SIMULATION LOGIC: KEEP FOR NOW ***
      setUser({ name: 'Reloaded User', role: storedRole });
      setRole(storedRole);
      setIsAuthenticated(true);
    }
    setIsLoading(false); // Finished initial check
  }, []);

  // --- Login Function ---
  const login = async (email, password) => {
    setIsLoading(true);

    // --- BACKEND REPLACEMENT ZONE 2 (Login Request) ---
    /*
    try {
      //send email & password to backend 
      //Make the actual request to your backend login route 
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      // Expect token, user object, and role from the backend
      const { token, user } = response.data;
      
      // CRUCIAL: Store the token and the role
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', user.role); // Store the actual role
      
      setUser(user);
      setRole(user.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Network error or server down.';
      return errorMessage; // Return the error message string
    } finally {
      setIsLoading(false);
    }
  }; */
   
    // --- END BACKEND REPLACEMENT ZONE 2 --

    // *** TESTING SIMULATION LOGIC: KEEP FOR NOW ***
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const simulatedRole = email.toLowerCase().includes('admin') ? 'admin' : 'user';
    
    // Simulate successful login
    localStorage.setItem('authToken', 'fake_jwt_token'); 
    localStorage.setItem('userRole', simulatedRole); 
    
    setUser({ id: 1, name: email, role: simulatedRole });
    setRole(simulatedRole);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true; 
    // *** END TESTING SIMULATION LOGIC ***
  };

  // --- Logout Function ---
  const logout = () => {
    // Clear storage and reset state
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userRole'); 
    
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
  };

  // If the initial check is running, display a loading screen
  if (isLoading) {
    return <h1>AUTH IS LOADING!</h1>; 
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