import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// BACKEND PLACEHOLDER: Import useAuth
import { useAuth } from '../../context/AuthContext'; 
import './AdminHeader.css'; 

const AdminHeader = () => {
    // 🛑 BACKEND PLACEHOLDER: Uncomment the context hook
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const username = user?.displayName || user?.email.split('@')[0] || "Admin";  

    const handleLogout = () => {
        logout(); 
        navigate('/login', { replace: true });
    };

    return (
        <header className="admin-header">
            {/* Left Section: Logo and Navigation Links */}
            <div className="header-left">
                
                {/* Logo/Home Link (Routes to Admin Dashboard home) */}
                <Link to="/admin" className="admin-logo-link">
                    LostHub
                </Link>
                
                {/* Admin Navigation Link */}
                <nav className="header-nav">
                    <Link to="/admin/usermanage" className="nav-link">
                        User Management
                    </Link>
                </nav>
            </div>

            {/* Right Section: Welcome Message and Logout Button */}
            <div className="header-right">
                <span className="welcome-message">
                    Welcome , <strong>{username}</strong>
                </span>
                <button 
                    onClick={handleLogout} 
                    className="logout-button"
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;