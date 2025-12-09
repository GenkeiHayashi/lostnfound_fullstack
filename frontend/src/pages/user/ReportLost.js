import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import axios from 'axios'; 
import PersonIcon from '../../assets/person.png'; 
import { useAuth } from '../../context/AuthContext'; 
import './ReportLost.css'; 

// Item Categories (Used in the dropdown)
const CATEGORIES = ['Electronics', 'Stationery', 'Books', 'Clothing', 'Personal Items', 'Others'];

// 🛑 BACKEND PLACEHOLDER: API URL for posting new items
const ITEMS_API_URL = 'https://losthub-backend.vercel.app/api/items'; 


// --- DYNAMIC HEADER PLACEHOLDER ---
// Temporarily includes login/routing logic for a seamless testing experience.
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
                <div className="person-badge">  
                     <img src={PersonIcon} alt="Person Icon" className="person-icon" /> 
                    <span className="welcome-message">
                     <strong>{username}</strong>
                    </span>
                </div>
                
                {/* Logout button is visible only if authenticated */}
                {/* {isAuthenticated ? ( */}
                <div className="header-buttons-container">
                    <button onClick={handleLogout} className="logout-button-link">
                        <LogOut size={18} className="icon-left" />
                        Log Out
                    </button> 
                </div>   
            </div>
        </header>
    );
};


const ReportLost = () => {
    // State to hold all form data
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        lastSeenLocation: '',
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
            setItemImage(e.target.files[0]);
        }
    };

    // --- Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🛑 SECURITY STEP 1: Check for Authentication (Essential)
        if (!token || !user?.uid) {
            alert('Security Error: You must be logged in to report an item.');
            setIsLoading(false);
            navigate('/login', { replace: true }); 
            return; 
        }

        // Client-side validation: Check all mandatory fields (Name, Category, Description, Image)
        if (!formData.name || !formData.category || !formData.description || !itemImage) {
            alert('Please fill in all mandatory fields and upload an image.');
            return;
        }

        setIsLoading(true);

        // 🛑 BACKEND PLACEHOLDER: This block contains the real API submission logic
        try {
            // Prepare data structure: Files must be sent using FormData.
            const submissionData = new FormData();

            // Map form state fields directly to backend Firestore fields:
            submissionData.append('name', formData.name);
            submissionData.append('category', formData.category);
            submissionData.append('lastSeenLocation', formData.lastSeenLocation);
            submissionData.append('description', formData.description);

            //Set fixed fields required by server 
            submissionData.append('status', 'lost');

            // Append the actual image file:
            submissionData.append('itemImage', itemImage); // The file itself
            
            //Uncomment this line to add the authenticated user's ID
            submissionData.append('posterUid', user.uid); // Add user ID
            
            // 3. Send data to Express Backend
            const apiResponse = await axios.post(ITEMS_API_URL, submissionData, {
                headers: {
                    // CRUCIAL: Set Content-Type to multipart/form-data (required for file uploads)
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });

            if (apiResponse.data.success) {
                setShowSuccessModal(true);
            }
        } catch (err) {
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
        <div className="report-lost-page">
            <StandaloneHeader /> 

            <main className="report-lost-main">
                <div className="report-lost-container">
                    
                    <div className="form-header">
                         <h1 className="form-title">Report Lost Item</h1>
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
                                placeholder="Enter lost item name"
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

                            {/* 3. Last Seen Location */}
                            <label htmlFor="lastSeenLocation">Last Seen Location*</label>
                            <input
                                type="text"
                                id="lastSeenLocation"
                                name="lastSeenLocation"
                                value={formData.lastSeenLocation}
                                onChange={handleChange}
                                required
                                placeholder="Eg: Arked Lestari C2 Mart, FKE Undergraduate Office"
                                disabled={isLoading}
                                className="form-input"
                            />

                            {/* 4. Description */}
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
                                    accept="image/jpeg/png" // Accept only JPG & PNG
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
                                            Click here to upload photo or similar item photo
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* 5. Submission Buttons */}
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
            {/* Success Pop-up */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Report Submitted Successfully!</h2>
                        <p>Your lost item report has been recorded and will be posted after admin approval.</p>
                        <button onClick={closeSuccessModal} className="modal-button">OK</button>
                    </div>
                </div>
            )}
            
            {/* Cancel Confirmation Pop-up */}
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

export default ReportLost;