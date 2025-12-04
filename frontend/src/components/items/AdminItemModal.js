import React, { useState } from 'react';
import './AdminItemModal.css'; // Dedicated CSS for the complex modal

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


const AdminItemModal = ({ item, onClose, onAction, successActionType, showSuccessModal}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmActionType, setConfirmActionType] = useState('');
    const [showFullImage, setShowFullImage] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (!item) return null;

    // --- Dynamic Content based on Status ---
    const isPending = !item.isApproved;
    const isFound = item.status === 'found';

    const locationDetailComponent = isFound ? (
        <>
            <p><strong>Last Seen Location:</strong> {item.lastSeenLocation || 'N/A'}</p>
            <p><strong>Item Collect Location:</strong> {item.itemCollectLocation || 'N/A'}</p>
        </>
    ) : (
        <p><strong>Last Seen Location:</strong> {item.lastSeenLocation || 'N/A'}</p>
    );

    // --- Action Handlers ---
    
    // Step 1: Open Confirmation Modal
    const handleConfirmOpen = (action) => {
        setConfirmActionType(action);
        setShowConfirm(true);
    };

    // Step 2: Execute Final Action (Approve or Delete)
    const handleConfirmFinal = async () => {
        setShowConfirm(false);
        onClose(); // Close the main modal immediately
        
        // Execute the action passed from the dashboard container
        await onAction(item.id, confirmActionType); 

        if (confirmActionType === 'approve'){
            setShowSuccess(true);
        } else if (confirmActionType === 'reject' || confirmActionType === 'delete'){
            setShowSuccess(true); 
        }
    };
    
    // --- Render Action Buttons ---
    const renderActionButtons = () => {
        if (isPending) {
            // Pending State: Approve or Reject
            return (
                <div className="action-buttons-group">
                    <button onClick={() => handleConfirmOpen('approve')} className="btn btn-approve">
                        Approve
                    </button>
                    <button onClick={() => handleConfirmOpen('reject')} className="btn btn-reject">
                        Reject
                    </button>
                </div>
            );
        } else {
            // Approved State: Delete or Back
            return (
                <div className="action-buttons-group">
                    <button onClick={() => handleConfirmOpen('delete')} className="btn btn-delete">
                        Delete
                    </button>
                    <button onClick={onClose} className="btn btn-back">
                        Back
                    </button>
                </div>
            );
        }
    };


    // --- Render Confirm Modal ---
    const renderConfirmModal = () => {
        if (!showConfirm) return null;
        
        const isDelete = confirmActionType === 'reject' || confirmActionType === 'delete';
        const actionVerb = confirmActionType === 'reject' ? 'delete' : confirmActionType;

        return (
            <div className="modal-overlay modal-confirm">
                <div className="modal-content modal-confirm-content">
                    <h2>Are you sure you want to {actionVerb}?</h2>
                    <p>
                        {isDelete 
                            ? 'If yes, this post will be permanently removed from the database.'
                            : 'If yes, the post will be marked as approved and shown to all users.'
                        }
                    </p>
                    <div className="modal-actions">
                        <button onClick={handleConfirmFinal} className={`btn btn-confirm-${actionVerb}`}>
                            Yes
                        </button>
                        <button onClick={() => setShowConfirm(false)} className="btn btn-cancel">
                            No
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Render Success Modal ---
    const renderSuccessModal = () => {
        if (!showSuccess) return null;
        
        //const actionType = successActionType;

        let message = '';
        if (confirmActionType === 'approve') {
            message = "Approved successfully! The post is now visible to users.";
        } else {
            message = "Post deleted! The item has been permanently removed.";
        }
        
        return (
            <div className="modal-overlay modal-confirm">
                <div className="modal-content modal-success-content">
                    <h2>{successActionType === 'approve' ? 'Approved Successfully!' : 'Post Deleted!'}</h2>
                    <p>{message}</p>
                    <button onClick={() => setShowSuccess(false)} className="btn btn-confirm-ok">
                        OK
                    </button>
                </div>
            </div>
        );
    };


    // --- Main Modal Render ---
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-main" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2>{isPending ? 'Pending Review' : 'Approved Item'}</h2>
                </div>

                <div className="modal-body-grid">
                    {/* Left Side: Image */}
                    <div className="modal-image-container">
                        <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="modal-item-image"
                            onClick={() => setShowFullImage(true)} // Click to view full image
                        />
                        <span className="image-label">Click image for full view</span>
                    </div>

                    {/* Right Side: Details */}
                    <div className="modal-details-list">
                        <p><strong>Item Name:</strong> {item.name}</p>
                        <p><strong>Category:</strong> {item.category}</p>
                        
                        {locationDetailComponent} 
                        
                        <p><strong>Description:</strong> {item.description || 'N/A'}</p>
                        <p><strong>Date Reported:</strong> {formatTimestamp(item.dateReported)}</p>
                    </div>
                </div>

                <div className="modal-footer">
                    {renderActionButtons()}
                </div>
            </div> 
            
            {/* Full Screen Image Viewer Modal */}
            {showFullImage && (
                <div className="modal-overlay modal-full-image" onClick={() => setShowFullImage(false)}>
                    <img src={item.imageUrl} alt={item.name} className="full-image-viewer" />
                    <button onClick={() => setShowFullImage(false)} className="full-image-close">X</button>
                </div>
            )}
            
            {/* Confirmation and Success Modals */}
            {renderConfirmModal()}
        </div>
    );
};

export default AdminItemModal;