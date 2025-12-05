import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';
import AdminItemModal from '../../components/items/AdminItemModal'; // New Modal Component

const DashboardHeader = () => {
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
                    Log Out
                </button>
            </div>
        </header>
    );
};

// --- UTILITIES & MOCK DATA (Same as AllPosts) ---
const CATEGORIES = ['Electronics', 'Stationery', 'Books', 'Clothing', 'Personal Items', 'Others'];
// 🛑 BACKEND PLACEHOLDER: API URLS
const ITEMS_API_URL = 'https://losthub-backend.vercel.app/api/items'; 
const APPROVE_API_URL = 'https://losthub-backend.vercel.app/api/admin/approve-item'; 
const DELETE_API_URL = 'https://losthub-backend.vercel.app/api/admin/items'; 

// Utility function to format timestamp from Firestore
const formatTimestamp = (timestamp) => {
    // 1. Handle null, undefined, or N/A
    if (!timestamp) {
        return 'N/A';
    }
    let dateObject;
    // Check for SERIALIZED Firebase Timestamp (Most common for API response)
    if (typeof timestamp === 'object' && timestamp._seconds) {
        // Data is a plain JSON object like { _seconds: X, _nanoseconds: Y }
        // Manually convert the seconds property to milliseconds for the Date constructor
        dateObject = new Date(timestamp._seconds * 1000); 
    }
    // If conversion was successful, format the date
    else {
        // If none of the above, return N/A
        return 'N/A';
    }
    // Return the formatted date string
    return dateObject.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

const AdminDashboard = () => {
    // State for filtering
    const [statusFilter, setStatusFilter] = useState('lost'); // Default: Lost
    const [categoryFilter, setCategoryFilter] = useState(''); // Default: All
    const [approvalFilter, setApprovalFilter] = useState('pending'); // 🛑 NEW: Default to Pending
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); 
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // 🛑 BACKEND PLACEHOLDER: Auth context
    const { token } = useAuth();

    const fetchItems = async () => {
        setIsLoading(true);
        // Ensure token is available for the API call
        if (!token) {
            console.error("Token missing. Cannot fetch items securely.");
            setItems([]);
            setIsLoading(false);
            return;
        }

    try {
            // 🛑 API CALL 1: Fetch filtered items
            // NOTE: The current backend /api/items filters only by status and category.
            // We fetch all and perform the isApproved filter on the frontend for now 
            // until the backend is updated to support isApproved query parameter.
            const response = await axios.get(ITEMS_API_URL, {
                params: { 
                    status: statusFilter, 
                    category: categoryFilter || undefined, 
                    approvalStatus: approvalFilter
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            // The data received is assumed to be pre-filtered by the backend
            setItems(response.data); 

        } catch (error) {
            console.error("Admin fetch failed:", error.response?.data?.message || error.message);
            // On API failure, simply clear items and display the error message
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [statusFilter, categoryFilter, approvalFilter , token, refreshTrigger ]); // Dependencies are correct


    // 🛑 ACTION HANDLERS (Approve/Reject/Delete) - INTEGRATED WITH BACKEND
    const handleAction = async (itemId, actionType) => {
        if (!token) {
            console.error("Error: Not authenticated. Cannot perform action.");
            return;
        }

        let endpoint = '';
        let method = '';
        let successMessage = '';

        try {
            if (actionType === 'approve') {
                // Calls POST /api/admin/approve-item/:itemId
                endpoint = `${APPROVE_API_URL}/${itemId}`;
                method = 'POST';
                successMessage = 'Approved successfully! Post is now visible.';
            } else if (actionType === 'reject' || actionType === 'delete') {
                // Reject (Pending) and Delete (Approved) both call DELETE /api/admin/items/:itemId
                endpoint = `${DELETE_API_URL}/${itemId}`;
                method = 'DELETE';
                successMessage = 'Post deleted permanently!';
            } else {
                return;
            }

            // 🛑 API CALL 2/3: Execute the action
            const response = await axios({
                method: method,
                url: endpoint,
                headers: { Authorization: `Bearer ${token}` }
            });

            // After successful action, close modal, and refresh data
            setSelectedItem(null); 
            console.log(successMessage);
            setRefreshTrigger(prev => prev + 1);          
        } catch (error) {
            console.error(`Action ${actionType} failed:`, error.response?.data || error.message);
            console.error(`Action failed: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    return (
        <div className="admin-dashboard-page">
            <DashboardHeader /> 
            
            <main className="admin-main-content">
                
                {/* --- Control Bar: Filters --- */}
                <div className="admin-control-bar">
                    
                    {/* 1. Category Dropdown (Same size as when shrunk) */}
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)} 
                        className="admin-dropdown category-dropdown"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    {/* 2. Approval Status Dropdown (Default Pending) */}
                    <select 
                        value={approvalFilter} 
                        onChange={(e) => setApprovalFilter(e.target.value)} 
                        className="admin-dropdown approval-dropdown"
                    >
                        <option value="pending">Pending Approval</option>
                        <option value="approved">Approved</option>
                    </select>

                    {/* 3. Status Toggle Buttons (Lost/Found) */}
                    <div className="status-toggle-group">
                        <button 
                            onClick={() => setStatusFilter('lost')}
                            className={`status-button ${statusFilter === 'lost' ? 'active-status' : ''}`}
                        >
                            Lost Item
                        </button>
                        <button 
                            onClick={() => setStatusFilter('found')}
                            className={`status-button ${statusFilter === 'found' ? 'active-status' : ''}`}
                        >
                            Found Item
                        </button>
                    </div>
                </div>

                {/* Item Grid */}
                {isLoading ? (
                    <div className="loading-state">Loading Items...</div>
                ) : (
                    <div className="item-grid-container">
                        {items.length > 0 ? (
                            items.map(item => (
                                <div key={item.id} className="item-card" onClick={() => setSelectedItem(item)}>
                                    <img src={item.imageUrl} alt={item.name} className="item-photo" />
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p>Status: {item.isApproved ? 'Approved' : 'Pending'}</p>
                                        <p>Reported: {formatTimestamp(item.dateReported)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-items-message">No {approvalFilter} {statusFilter} items found.</p>
                        )}
                    </div>
                )}
            </main>

            {/* Admin Action Modal */}
            <AdminItemModal 
                item={selectedItem} 
                onClose={() =>
                    setSelectedItem(null)}
                onAction={handleAction} // Pass the handler down
            />
        </div>
    );
};

export default AdminDashboard;