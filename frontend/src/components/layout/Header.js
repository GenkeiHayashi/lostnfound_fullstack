import React from 'react';

const Header = () => {
    // This is the component's function name.
    
    // The placeholder text helps you see that the component is loading correctly.
    return (
        <header style={{ padding: '15px', background: '#333', color: 'white' }}>
            <h1>[Layout]: Header Placeholder (Will contain navigation)</h1>
        </header> 
    );
};

// This is the essential step: Exporting the component so App.js can import it.
export default Header; 