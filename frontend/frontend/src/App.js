import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './components/layout/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';

import UserDashboard from './pages/user/UserDashboard';
import AllPosts from './pages/user/AllPosts';
import ReportLost from './pages/user/ReportLost';
import ReportFound from './pages/user/ReportFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import PostingManagement from './pages/admin/PostingManagement';

function App() {
  return (
    <BrowserRouter>
      {/* REMOVE <Header /> HERE */}
      
      <Routes>
        {/* ======================= 1. PUBLIC ROUTES ======================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<h1>Forgot Password Page Placeholder</h1>} />
        
        {/* ======================= 2. PROTECTED USER ROUTES ======================= */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
          
          {/* Main User Navigation */}
          {/* UserDashboard can be a simple redirect to /posts if it only says "Welcome" */}
          <Route path="/dashboard" element={<UserDashboard />} /> 
          
          <Route path="/posts" element={<AllPosts />} />
          <Route path="/report/lost" element={<ReportLost />} />
          <Route path="/report/found" element={<ReportFound />} />
        </Route>

        {/* ======================= 3. PROTECTED ADMIN ROUTES ======================= */}
        {/* Accessible ONLY to admin user (role: 'admin') */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          
          {/* Admin Dashboard (Home) */}
          <Route path="/admin" element={<AdminDashboard />} /> 

          {/* Posting Management Feature */}
          <Route path="/admin/posts/manage" element={<PostingManagement />} />
        </Route>

        {/* ======================= 4. FALLBACK ======================= */}
        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;