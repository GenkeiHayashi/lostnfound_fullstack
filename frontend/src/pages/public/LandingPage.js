import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react'; // Icons for Login and Sign Up
import './LandingPage.css'; // Essential: Import the CSS File
import LostHubLogo from '../../assets/LostHub_Logo.png'; 

const LandingPage = () => {
    // 1. UNIQUE HEADER COMPONENT (Using className)
    const LandingHeader = () => (
        // Use className instead of style={styles.header}
        <header className="landing-header">
            {/* Link uses className */}
            <Link to="/" className="landing-logo">
                LostHub
            </Link>

            {/* Right Side: Navigation Buttons */}
            <div className="header-buttons-container">
                {/* Login Button uses className */}
                <Link to="/login" className="header-button header-login-btn">
                    <LogIn size={18} className="icon-left" />
                    Log In
                </Link>
                
                {/* Sign Up Button (Primary Action) uses className */}
                <Link to="/signup" className="header-button header-signup-btn">
                    <UserPlus size={18} className="icon-left" />
                    Sign Up
                </Link>
            </div>
        </header>
    );

    // 2. UNIQUE FOOTER COMPONENT (Using className)
    const LandingFooter = () => (
        <footer className="landing-footer">
            <p className="footer-copyright">
                &copy; 2025 LostHub HUNTWØ All Rights Reserved.
            </p>
        </footer>
    );


    // 3. MAIN RENDER FUNCTION
    return (
        // Apply the critical page-wrapper class
        <div className="page-wrapper"> 
            <LandingHeader />
            
            <main className="main-content">
                
                {/* Content Grid */}
                <div className="landing-grid">
                    
                    {/* Left Section */}
                    <div className="hero-section">
                        <h2 className="welcome-text">Welcome to</h2>
                         {/*<h1 className="website-name">LostHub</h1> */}
                        <div className="logohub-icon">
                            <img 
                                className="losthub-logo-img" 
                                src={LostHubLogo} 
                                alt="LostHub Logo" 
                            />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="description-section">
                        <h3 className="description-title">Lost it? We'll help you find what matters.</h3>
                        <p className="description-text">
                            In universities, where thousands of students and staff move around daily, personal items such as student IDs, wallets, electronic devices, and keys are frequently misplaced. 
                            The current process of recovering these items is largely manual, relying on notice boards, social media groups, or word of mouth, which often leads to inefficiency, confusion, and low recovery rates. 
                        </p>
                        <p className="description-text highlight">
                            Therefore, LostHub is here for you. it is a centralized, AI-powered Lost and Found web that allows users to report lost or found items with descriptions and images. 
                            This solution would streamline the recovery process, reduce stress, and promote a more connected and responsible campus environment.
                        </p>
                    </div>
                </div>
            </main>
            
            <LandingFooter />
        </div>
    );
};

export default LandingPage;