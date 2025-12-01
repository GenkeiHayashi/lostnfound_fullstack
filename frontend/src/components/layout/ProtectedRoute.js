import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Access the Auth state

/*
 * A wrapper component that checks user authentication and authorization (role).
 * It uses the 'Outlet' component from React Router to render child routes.
  @param {string[]} allowedRoles - An array of roles permitted to access this route (e.g., ['user', 'admin']).
 */

const ProtectedRoute = ({ allowedRoles }) => {
  // Pull authentication state from the AuthContext
  const { isAuthenticated, role, isLoading } = useAuth();
  
  // 1. Handle Loading State
  // If the app is still checking the token from local storage, wait.
  if (isLoading) {
    return <div>Loading user session...</div>; 
  }

  // 2. Check Authentication
  if (!isAuthenticated) {
    // User is not logged in: Redirect them to the login page.
    // 'replace' ensures the login page replaces the current entry in the history stack.
    return <Navigate to="/login" replace />;
  }

  // 3. Check Authorization (Role)
  // Check if the user's current role is included in the list of allowedRoles for this route.
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in, but role is not authorized (e.g., user tries to access /admin):
    // Redirect to a specific unauthorized page or the user's default dashboard.
    console.warn(`Access denied: User role (${role}) not in allowed roles: [${allowedRoles.join(', ')}]`);
    
    const defaultRedirect = role === 'admin' ? '/admin' : '/posts';
    
    // Redirect to the appropriate home page for their current role
    return <Navigate to={defaultRedirect} replace />;
  }

  // 4. Authorized: Render the nested route component
  // 'Outlet' renders the child component defined in App.js (e.g., <AdminDashboard />)
  return <Outlet />;
};

export default ProtectedRoute;
