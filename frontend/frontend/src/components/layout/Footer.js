import React from 'react';

const Footer = () => {
    // This component will always be displayed at the bottom of the page
    return (
        <footer style={{ 
            padding: '10px', 
            background: '#333', 
            color: 'white', 
            textAlign: 'center',
            position: 'fixed', // Fixed to the bottom of the viewport
            bottom: 0,
            width: '100%',
            boxShadow: '0 -2px 5px rgba(0,0,0,0.1)'
        }}>
            {/* Display the current year dynamically */}
            <p>&copy; {new Date().getFullYear()} University Lost & Found System</p>
        </footer>
    );
};

// Crucial: Export the component so App.js can use it
export default Footer;