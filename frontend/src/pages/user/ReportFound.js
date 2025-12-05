import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; 
import { useAuth } from '../../context/AuthContext'; 
import './ReportFound.css'; 

// Item Categories (Same as used in AllPosts)
const CATEGORIES = ['Electronics', 'Stationery', 'Books', 'Clothing', 'Personal Items', 'Others'];

// --- API CONFIGURATION ---
const ITEMS_API_URL = 'https://losthub-backend.vercel.app/api/items'; 

// --- DYNAMIC HEADER COMPONENT ---
const StandaloneHeader = () => {
    // 🛑 BACKEND INTEGRATION: Destructure user and logout
    const { user, logout } = useAuth(); 
    const navigate = useNavigate();

    // Determine display name based on available user data
    const username = user?.displayName || user?.email.split('@')[0] || "User";
    
    const handleLogout = () => {
        logout(); 
        navigate('/login', { replace: true });
    };

    return (
        <header className="main-header"> 
            <div className="header-left">
                {/* Logo click brings user back to AllPosts page */}
                <Link to="/posts" className="header-logo-link">LostHub</Link>
            </div>

            <div className="header-right">
                <div className="person-icon-placeholder" 
                     style={{width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#eee', border: '1px solid #ccc'}}>
                </div>
                <span className="welcome-message">
                    <strong>{username}</strong>
                </span>
                
                <a href="/login" onClick={handleLogout} className="logout-button-link">
                    Logout
                </a>
            </div>
        </header>
    );
};

const ReportFound = () => {
    // State to hold all form data, including the new 'itemCollectLocation'
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        lastSeenLocation: '',
        itemCollectLocation: '',
        description: '',
    });
    const [itemImage, setItemImage] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    
    // State for managing pop-ups
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const navigate = useNavigate();
    // 🛑 BACKEND PLACEHOLDER: Uncomment to get token and UID
    const { user, token } = useAuth(); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            // FIX: Set file and create a temporary URL for preview
            setItemImage(e.target.files[0]);
        }
    };

    // --- Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!token || !user?.uid) {
            alert('Security Error: You must be logged in to report an item.');
            navigate('/login', { replace: true }); // Force redirect
            return; 
        }

        // Client-side validation: Check all mandatory fields (Name, Category, Description, Image)
        if (!formData.name || !formData.category || !formData.description || !itemImage || !formData.itemCollectLocation) {
            alert('Please fill in all mandatory fields (including Item Collect Location) and upload an image.');
            return;
        }

        setIsLoading(true);

        try {
            // Prepare data structure: Files must be sent using FormData.
            const submissionData = new FormData();

            // Map form state fields directly to backend Firestore fields:
            submissionData.append('name', formData.name);                   // -> name (Item Name)
            submissionData.append('category', formData.category);           // -> category (Category)
            submissionData.append('lastSeenLocation', formData.lastSeenLocation); // -> lastSeenLocation
            submissionData.append('itemCollectLocation', formData.itemCollectLocation); // -> itemCollectLocation
            submissionData.append('description', formData.description);     // -> description
            
            // Set fixed fields required by the server:
            submissionData.append('status', 'found');                       // -> status (Fixed value: found)
            submissionData.append('itemImage', itemImage);                  // -> image 
            
            submissionData.append('posterUid', user.uid); // Add user ID
            
            // 2. Send data to Express Backend
            const apiResponse = await axios.post(ITEMS_API_URL, submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data', 
                    Authorization: `Bearer ${token}` 
                }
            });

            if (apiResponse.data.success) {
                setShowSuccessModal(true); 
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to submit report. Please check server status.';
            alert(`Submission Error: ${err.response?.data?.message || 'Failed to connect to backend server.'}`);
        } finally {
            setIsLoading(false);
        }

    };
    
    // --- Cancel Logic ---
    const handleCancel = () => {
        setShowCancelConfirm(true);
    };

    const confirmCancel = () => {
        navigate('/posts', { replace: true }); // Route back to AllPosts
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/posts', { replace: true }); // Route back to AllPosts after success
    };


    return (
        <div className="report-found-page">
            <StandaloneHeader /> 

            <main className="report-found-main">
                <div className="report-found-container">
                    
                    <div className="form-header">
                         <h1 className="form-title">Report Found Item</h1>
                         {/* Optional: Add error/success messages here */}
                    </div>

                    <form onSubmit={handleSubmit} className="report-form">

                        <div className="form-column form-left">

                            {/* 1. Item Name */}
                            <label htmlFor="name">Item Name*</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter found item name"
                                required
                                disabled={isLoading}
                                className="form-input"
                            />

                            {/* 2. Category Dropdown */}
                            <label htmlFor="category">Category*</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                className="form-select"
                            >
                                <option value="" disabled>Select a Category</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* 3. Last Seen Location (Where the item was physically found) */}
                            <label htmlFor="lastSeenLocation">Last Seen Location</label>
                            <input
                                type="text"
                                id="lastSeenLocation"
                                name="lastSeenLocation"
                                value={formData.lastSeenLocation}
                                onChange={handleChange}
                                placeholder="Eg: Arked Lestari C2 Mart, FKE Undergraduate Office"
                                disabled={isLoading}
                                className="form-input"
                            />

                            {/* 4. Item Collect Location (Where the finder placed the item) */}
                            <label htmlFor="itemCollectLocation">Item Collect Location*</label>
                            <input
                                type="text"
                                id="itemCollectLocation"
                                name="itemCollectLocation"
                                value={formData.itemCollectLocation}
                                onChange={handleChange}
                                placeholder="Eg: P19a BT1, PRZS"
                                required // Made mandatory as the item must be locatable
                                disabled={isLoading}
                                className="form-input"
                            />

                            {/* 5. Description */}
                            <label htmlFor="description">Description*</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the item details, such as colors, features, appearance"
                                rows="4"
                                required
                                disabled={isLoading}
                                className="form-textarea"
                            />
                        </div>

                        {/* --- Right Column: Image Upload --- */}
                        <div className="form-column form-right">
                            <label className="image-label">Upload Image (JPG/PNG)*</label>
                            <div className="image-upload-box">
                                <input
                                    type="file"
                                    id="itemImage"
                                    name="itemImage"
                                    accept="image/jpeg, image/png" // Accept JPG and PNG
                                    onChange={handleImageChange}
                                    disabled={isLoading}
                                    className="file-input-hidden"
                                />
                                <div className="image-preview">
                                    {itemImage ? (
                                        <img 
                                            src={URL.createObjectURL(itemImage)} 
                                            alt="Item Preview" 
                                            className="preview-image"
                                        />
                                    ) : (
                                        <p className="upload-prompt">
                                            Click here to upload photo
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* 6. Submission Buttons */}
                        <div className="form-submit-row">
                            <button type="submit" disabled={isLoading} className="submit-button submit">
                                {isLoading ? 'Submitting...' : 'Submit Report'}
                            </button>
                            <button type="button" onClick={handleCancel} disabled={isLoading} className="submit-button cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            
            {/* --- Modals --- */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Report Submitted Successfully!</h2>
                        <p>Your found item report has been recorded and will be posted after admin approval.</p>
                        <button onClick={closeSuccessModal} className="modal-button">OK</button>
                    </div>
                </div>
            )}
            
            {showCancelConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Are you sure to cancel?</h2>
                        <p>All your progress will be lost.</p>
                        <div className="modal-actions">
                            <button onClick={confirmCancel} className="modal-button yes">Yes</button>
                            <button onClick={() => setShowCancelConfirm(false)} className="modal-button no">No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportFound;