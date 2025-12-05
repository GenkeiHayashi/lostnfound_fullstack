import {useState} from 'react';
import './ItemDetailsModal.css'; 

// Utility function to format timestamp (copied here for standalone testing)
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


const ItemDetailsModal = ({ item, onClose }) => {
    const [showFullImage, setShowFullImage] = useState(false);

    if (!item) return null;

    // --- Dynamic Location Field Logic ---
    let locationDetailComponent;
    
    if (item.status === 'lost') {
        // STRUCTURE FOR LOST ITEM
        locationDetailComponent = (
            <>
                <p><strong>Last Seen Location:</strong> {item.lastSeenLocation || 'N/A'}</p>
                <p><strong>Description:</strong> {item.description || 'N/A'}</p>
            </>
        );
    } else if (item.status === 'found') {
        // STRUCTURE FOR FOUND ITEM (Adds Item Collect Location)
        locationDetailComponent = (
            <>
                <p><strong>Last Seen Location:</strong> {item.lastSeenLocation || 'N/A'}</p>
                <p><strong>Item Collect Location:</strong> {item.whereToCollect || 'N/A'}</p>
                <p><strong>Description:</strong> {item.description || 'N/A'}</p>
            </>
        );
    }
    
    return (
        // The modal wrapper handles the transparent background and closes on outside click
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>{item.status === 'lost' ? 'Lost Item Details' : 'Found Item Details'}</h2>
                </div>

                <div className="modal-body-grid">
                    {/* Left Side: Image */}
                    <div className="modal-image-container">
                        <img 
                            src={item.imageUrl || 'https://via.placeholder.com/300x200?Text=No+Image'} 
                            alt={item.name} 
                            className="modal-item-image"
                            onClick={() => setShowFullImage(true)}
                        />
                        <span className="image-label">Image Preview (imageUrl from firebase)</span>
                    </div>

                    {/* Right Side: Details */}
                    <div className="modal-details-list">
                        <p><strong>Item Name:</strong> {item.name}</p>
                        <p><strong>Category:</strong> {item.category}</p>
                        
                        {/* Dynamic Location and Description Details */}
                        {locationDetailComponent}
                        
                        <p><strong>Date Reported:</strong> {formatTimestamp(item.dateReported)}</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="back-button">Back</button>
                </div>
            </div>

             {/* Full Screen Image Viewer Modal */}
            {showFullImage && (
                <div className="modal-overlay modal-full-image" onClick={() => setShowFullImage(false)}>
                    <img src={item.imageUrl} alt={item.name} className="full-image-viewer" />
                    <button onClick={() => setShowFullImage(false)} className="full-image-close">X</button>
                </div>
            )}
            
        </div>
    );
};

export default ItemDetailsModal;