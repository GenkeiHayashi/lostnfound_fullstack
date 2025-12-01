import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import ItemDetailsModal from '../../components/items/ItemDetailsModal';
import './AllPosts.css'; // For layout and styling
// Import axios for API calls
import axios from 'axios'; 
// Import useAuth to get token and displayName
import { useAuth } from '../../context/AuthContext';

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

// Item Categories (Used in the dropdown)
const CATEGORIES = ['Electronics', 'Stationery', 'Books', 'Clothing', 'Personal Items', 'Others'];

// 🛑 BACKEND PLACEHOLDER: API URL
const ITEMS_API_URL = 'http://localhost:3000/api/items';

// --- STATIC HEADER PLACEHOLDER with BACKEND LOGIC---
const StaticHeader = () => {
    // 🛑 BACKEND PLACEHOLDER: Uncomment this line to get user data from context
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // Add hook for navigation

    // 🛑 BACKEND PLACEHOLDER: Replace "TestUser" with the user's actual display name
    const username = user?.displayName || user?.email.split('@')[0] || "User"; 
    // const username = "TestUser"; // MOCK USERNAME

    // 🛑 BACKEND PLACEHOLDER: Replace a href with navigate(to) or use the actual logout function
    const handleLogout = () => {
        logout(); 
        navigate('/login', { replace: true });
    };

    return (
    <header className="main-header"> {/* Use a common class for the header container */}
        
        {/* Left Section: Logo and Navigation Links */}
        <div className="header-left">
            <a href="/posts" className="header-logo-link">LostHub</a>
            
            <nav className="header-nav">
                <a href="/report/lost" className="nav-link">Report Lost</a>
                <a href="/report/found" className="nav-link">Report Found</a>
            </nav>
        </div>

        {/* Right Section: Welcome Message and Logout */}
        <div className="header-right">
            <span className="welcome-message">
                Welcome, <strong>{username}</strong> {/* Uses actual username */}
            </span>
            <a href="#" onClick={handleLogout} className="logout-button-link"> {/* Use onClick and remove hardcoded href */}
                Logout
            </a>
        </div>
    </header>
    );
};
// -----------------------------------------------------------------

const AllPosts = () => {
    const [statusFilter, setStatusFilter] = useState('lost'); // Default: Lost Item view
    const [categoryFilter, setCategoryFilter] = useState(''); 
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // State for Modal

    // 🛑 BACKEND PLACEHOLDER: Get token for API headers
    const { token } = useAuth();

    // BACKEND PLACEHOLDER: useEffect needs to be replaced with a real data fetch function
    useEffect(() => {
        // Function to fetch data from the API
        const fetchItems = async () => {
        setIsLoading(true);
        console.log("Token being sent:", token);
        // 🛑 BACKEND PLACEHOLDER: Query parameters for the backend
            const params = {
                status: statusFilter,
                category: categoryFilter || undefined,
            };

            try {
                // 🛑 BACKEND PLACEHOLDER: UNCOMMENT this block to use the backend
                const response = await axios.get(ITEMS_API_URL, {
                    params,
                    headers: { Authorization: `Bearer ${token}` } // Send JWT token
                });
                setItems(response.data); 

            } catch (error) {
                console.error("Failed to fetch items:", error);
                // Redirect to login if token is invalid (401/403)
                if (error.response?.status === 401 || error.response?.status === 403) {
                     // navigate('/login', { replace: true }); // Uncomment if you want immediate redirect on bad token
                }
                setItems([]); // Clear items on failure
            } finally {
                setIsLoading(false);
            }

        };
    // 🛑 BACKEND PLACEHOLDER: Add token dependency when uncommenting API call
    // 🔑 CHANGE 7: Add 'token' to the dependency array, ensuring data fetches whenever the token becomes available (after login)
        // Also ensure fetchItems is only called if the token exists to prevent an immediate error.
        if (token) {
            fetchItems(); 
        } else {
        setIsLoading(false);
        } 
    }, [statusFilter, categoryFilter, token ]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    return (
        <div className="all-posts-page">
            <StaticHeader /> 
            
            <main className="posts-main-content">
                
                {/* Top Control Bar: Filters */}
                <div className="posts-control-bar">
                    
                    {/* 1. Category Dropdown */}
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)} 
                        className="category-dropdown"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    {/* 2. Status Toggle Buttons */}
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
                    <div className="loading-state">Loading items from Firebase...</div>
                ) : (
                    <div className="item-grid-container">
                        {items.length > 0 ? (
                            items.map(item => (
                                <div key={item.id} className="item-card" onClick={() => handleItemClick(item)}>
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.name} 
                                        className="item-photo"
                                    />
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p>Reported: {formatTimestamp(item.dateReported)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-items-message">No {statusFilter} items found in this category.</p>
                        )}
                    </div>
                )}
            </main>

            {/* Item Details Modal */}
            <ItemDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
    );
};

export default AllPosts;