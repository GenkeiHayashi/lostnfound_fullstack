import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, LogOut, X } from 'lucide-react'; // Only keeping used Lucide icons
import './UserManagement.css'; // Importing the CSS file
import PersonIcon from '../../assets/person.png'; // Assuming you save the image here
import PersonUpIcon from '../../assets/personup.png'; // Assuming you save the image here
import PersonDownIcon from '../../assets/persondown.png'; // Assuming you save the image here
import axios from 'axios'; // Import Axios for API calls
import { useAuth } from '../../context/AuthContext'; // To access token and current user info

const USERS_SEARCH_API_URL = 'https://losthub-backend-git-vercel-deploy-genkeihayashis-projects.vercel.app/api/admin/users/search'; 
const SET_ROLE_API_URL = 'https://losthub-backend-git-vercel-deploy-genkeihayashis-projects.vercel.app/api/admin/set-role'; 

// Custom hook for debouncing the search input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};


// Main Component
const UserManagement= () => {
    const { token, user } = useAuth(); // Get token and current user data
    const [searchResults, setSearchResults] = useState([]); // Stores the list returned from the API
    const [isLoading, setIsLoading] = useState(false); // To show loading state
    // State for the text currently being typed into the search bar
    const [searchTerm, setSearchTerm] = useState('');
    // State for the debounced search term (used for filtering)
    const debouncedSearchTerm = useDebounce(searchTerm, 1000); // 1000ms debounce
    
    // State for the confirmation modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionUser, setActionUser] = useState(null);
    const [actionType, setActionType] = useState(null); // 'promote' or 'demote'
    
    // Hardcoded current admin ID for simulation purposes (cannot demote self)
    const currentAdminId = user?.uid;

    // Handler for fetching data from the backend
    const fetchUsers = useCallback(async () => {
    // We fetch only when the term is ready and the token is available
    if (!token) return;
    
    /*// The backend handles the empty/short term check, but we clear locally for responsiveness
    if (debouncedSearchTerm.length < 1) {
        setSearchResults([]);
        return;
    }
        */
    setIsLoading(true);
    try {
        const response = await axios.get(USERS_SEARCH_API_URL, {
            params: {
                term: debouncedSearchTerm
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        setSearchResults(response.data.users || []); // Assuming the API returns { users: [...] }

    } catch (error) {
        console.error("User search failed:", error.response?.data?.message || error.message);
        setSearchResults([]);
    } finally {
        setIsLoading(false);
    }
}, [debouncedSearchTerm, token]);

// 🔥 useEffect hook to trigger the fetch when the debounced term changes
useEffect(() => {
    fetchUsers();
}, [fetchUsers]); // Dependency on useCallback is correct

    // Split filtered users into Admin and Normal User tables
    const adminUsers = useMemo(() => 
        [...searchResults.filter(u => u.isAdmin)].sort((a, b) => a.email.localeCompare(b.email)),
        [searchResults]
    );
    
    const normalUsers = useMemo(() => 
        [...searchResults.filter(u => !u.isAdmin)].sort((a, b) => a.email.localeCompare(b.email)),
        [searchResults]
    );

    // Handler for Promote/Demote button click - opens the modal
    const handleActionClick = useCallback((user, type) => {
        setActionUser(user);
        setActionType(type);
        setIsModalOpen(true);
    }, []);

    // Handler for modal confirmation - performs the actual role change
    const handleConfirmAction = async () => { // Made async
        if (!actionUser || !actionType || !token) return;

        // Determine the new role string
        const newRole = actionType === 'promote' ? 'admin' : 'user';
        setIsLoading(true); // Show loading while updating role

        try {
            // 🔥 API CALL: Send the action to the backend
            await axios.post(SET_ROLE_API_URL, 
                {
                targetUid: actionUser.uid, // Assuming the API returns uid
                role: newRole
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // Success: Log and force a refresh of the search results
        console.log(`Role change successful for ${actionUser.email}: New role is ${newRole}.`);
        alert(`Role change successful! ${actionUser.displayName} is now a ${newRole}.`);
        
        // After successful change, re-fetch the data to update the lists
        // NOTE: We don't update the local state directly, we re-run the search.
        fetchUsers(); 

    } catch (error) {
        console.error("Role change failed:", error.response?.data?.message || error.message);
        alert(`Role change failed: ${error.response?.data?.message || 'Server error.'}`);
    } finally {
        setIsLoading(false);
        // Close modal and reset state regardless of success/failure
        setIsModalOpen(false);
        setActionUser(null);
        setActionType(null);
    }
};

    // --- RENDER HELPERS ---
    
    // Reusable Table Component
    const UserTable = ({ title, data, actionType }) => {
        const isPromote = actionType === 'promote';
        
        return (
            <div className="table-wrapper">
                <h2 className="table-title">{title} ({data.length})</h2>
                
                {/* Responsive Table Container */}
                <div className="table-container">
                    {/* The custom CSS class 'table-scroll-container' handles the vertical scroll */}
                    <div className="table-scroll-container"> 
                        <table className="data-table">
                            <thead className="table-header-row">
                                <tr>
                                    <TableHeader>No.</TableHeader>
                                    <TableHeader>Email</TableHeader>
                                    <TableHeader className="table-data-cell-username">Username</TableHeader>
                                    <TableHeader>Role</TableHeader>
                                    <TableHeader>Action</TableHeader>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {data.map((user, index) => (
                                    <tr key={user.id} className="table-data-row">
                                        <TableData className="table-data-cell-index">{index + 1}</TableData>
                                        <TableData className="table-data-cell-email">
                                            {user.email}
                                        </TableData>
                                        <TableData className="table-data-cell-username">{user.displayName}</TableData>
                                        <TableData>
                                            <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                                                {user.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                        </TableData>
                                        <TableData className="action-cell">
                                            {/* Action Button: Promote or Demote */}
                                            <button
                                                onClick={() => handleActionClick(user, isPromote ? 'promote' : 'demote')}
                                                className={`action-button ${isPromote ? 'promote' : 'demote'}`}
                                                disabled={!isPromote && user.id === currentAdminId}
                                                title={!isPromote && user.id === currentAdminId ? "Cannot demote self" : isPromote ? "Promote to Admin" : "Demote to User"}
                                            >
                                                {/* Replaced Lucide icons with PNGs */}
                                                <img 
                                                    src={isPromote ? PersonUpIcon : PersonDownIcon} 
                                                    alt={isPromote ? "Promote" : "Demote"} 
                                                    className="action-img" 
                                                />
                                            </button>
                                        </TableData>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <TableData colSpan="5" className="empty-state">
                                            {debouncedSearchTerm ? `No results found for "${debouncedSearchTerm}".` : `No ${title.toLowerCase()} accounts found.`}
                                        </TableData>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Helper components for Table styling
    const TableHeader = ({ children, className = '' }) => (
        <th scope="col" className={`table-header-cell ${className}`}>
            {children}
        </th>
    );

    const TableData = ({ children, className = '' }) => (
        <td className={`table-data-cell ${className}`}>
            {children}
        </td>
    );

    return (
        <div className="user-management-page">
            {/* --- Header Component --- */}
            <header className="app-header">
                <div className="header-content">
                    {/* Left Side: LostHub (Link to Dashboard) */}
                    <div className="header-brand">
                        <a href="/admin">
                            LostHub
                        </a>
                    </div>

                    {/* Right Side: Admin Info and Logout */}
                    <div className="admin-info">
                        {/* Person Icon and Text */}
                        <div className="admin-badge">
                            {/* Replaced Lucide User icon with PNG */}
                            <img src={PersonIcon} alt="Admin Icon" className="admin-icon" /> 
                            <span className="admin-text">Admin</span>
                        </div>
                        
                        {/* Logout Button */}
                        <a 
                            href="/login" // Link back to login page
                            className="logout-btn"
                        >
                            <LogOut size={16} />
                            <span>Log Out</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="main-content">
                <h1 className="page-title">User Management</h1>

                {/* --- Search Bar with Debouncing --- */}
                <div className="search-container">
                    <Search size={24} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by email or username"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        disabled={isLoading} // 🔥 Disable during loading
                    />
                </div>
                
                {/* Debounce status display (optional, for testing) */}
                {searchTerm && searchTerm !== debouncedSearchTerm && (
                    <p className="debounce-status">
                        Please wait...
                    </p>
                )}
                
                {/* --- Admin Accounts Table --- */}
                <UserTable 
                    title="Administrator Accounts" 
                    data={adminUsers} 
                    actionType="demote" 
                />
                
                {/* --- Normal User Accounts Table --- */}
                <UserTable 
                    title="User Accounts" 
                    data={normalUsers} 
                    actionType="promote" 
                />
            </main>
            
            {/* --- Confirmation Modal --- */}
            {isModalOpen && actionUser && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div 
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {actionType === 'promote' ? 'Confirm Promotion' : 'Confirm Demotion'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <p className="modal-body">
                            {actionType === 'promote' 
                                ? `Are you sure to allow the account "${actionUser.email}" access administrator? This account will be promoted to admin role.`
                                : `Are you sure to remove administrator access for the account "${actionUser.email}"? This account will be demoted to user role.`
                            }
                        </p>
                        
                        <div className="modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="modal-btn cancel"
                            >
                                No (Cancel)
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`modal-btn confirm-${actionType}`}
                                disabled={isLoading} // 🔥 Disable button during loading/API call
                            >
                                {isLoading 
                                    ? `Updating...` 
                                    : `Yes (${actionType === 'promote' ? 'Promote' : 'Demote'})`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;