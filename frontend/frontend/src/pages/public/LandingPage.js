import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Essential: Import the CSS File

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
            <div>
                {/* Login Button uses className */}
                <Link to="/login" className="header-button header-login-btn">
                    Log In
                </Link>
                
                {/* Sign Up Button (Primary Action) uses className */}
                <Link to="/signup" className="header-button header-signup-btn">
                    Sign Up
                </Link>
            </div>
        </header>
    );

    // 2. UNIQUE FOOTER COMPONENT (Using className)
    const LandingFooter = () => (
        // Use className instead of style={styles.footer}
        <footer className="landing-footer">
            <p className="footer-copyright">
                &copy; 2025 LostHub UTM All Rights Reserved.
                <span className="footer-separator"> | </span> 
                <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                <span className="footer-separator"> | </span> 
                <Link to="/terms" className="footer-link">Terms</Link>
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
                        <h1 className="website-name">LostHub</h1>
                    </div>

                    {/* Right Section */}
                    <div className="description-section">
                        <p className="description-text">
                            In universities, where thousands of students and staff move around daily, personal items such as student IDs, wallets, electronic devices, and keys are frequently misplaced. 
                            The current process of recovering these items is largely manual, relying on notice boards, social media groups, or word of mouth, which often leads to inefficiency, confusion, and low recovery rates. 
                            To solve this problem, there is a need for a centralized, AI-powered Lost and Found web that allows users to report lost or found items with descriptions and images. 
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