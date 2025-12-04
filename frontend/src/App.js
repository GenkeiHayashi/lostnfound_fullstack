import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute'; 

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';

import AllPosts from './pages/user/AllPosts';
import ReportLost from './pages/user/ReportLost';
import ReportFound from './pages/user/ReportFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        {/* ======================= ALL ROUTES (UNPROTECTED) ======================= */}
        
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<h1>Forgot Password Page Placeholder</h1>} />
        
        {/* ======================= 2. AUTHENTICATED ROUTES (User or Admin) ======================= */}
        {/* These routes require the user to be logged in (role: 'user' OR 'admin') */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        
        {/* User Routes (Previously Protected) */}
        <Route path="/posts" element={<AllPosts />} />
        <Route path="/report/lost" element={<ReportLost />} />
        <Route path="/report/found" element={<ReportFound />} />
        </Route>

        {/* ======================= 3. ADMIN ONLY ROUTES ======================= */}
        {/* These routes require the highest level of authorization (role: 'admin') */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>

        {/* Admin Routes (Previously Protected) */}
        <Route path="/admin" element={<AdminDashboard />} /> 
        <Route path="/admin/usermanage" element={<UserManagement />} />
        
        </Route>

        {/* ======================= FALLBACK ======================= */}
        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;