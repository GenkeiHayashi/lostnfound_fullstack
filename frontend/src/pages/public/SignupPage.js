import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css'; // Import the dedicated CSS file
import LostHubLogo from '../../assets/LostHub_Logo.png';

// Backend URL where your Express server is running
const API_URL = 'https://losthub-backend.vercel.app/api/auth/register'; 

const SignupPage = () => {
    // State to manage form inputs
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // Function to handle form submission and backend call
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Check for minimum password length before sending
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                setIsLoading(false);
                return;
            }

            // Send data to your backend's registration route
            const response = await axios.post(API_URL, { 
                email, 
                password, 
                displayName 
            });

            // If successful (status 201), route to Login Page as requested
            if (response.status === 201) {
                alert('Registration successful! Please log in with your new account.');
                navigate('/login', { replace: true });
            }
        } catch (err) {
            // Check for specific backend error messages (e.g., email-already-in-use)
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page-wrapper">
            {/* The centered rectangular form window */}
            <div className="signup-form-container">
                
                <div className="logohub-icon">
                    <img 
                        className="signup-logo-image" 
                        src={LostHubLogo} 
                        alt="LostHub Logo" 
                        
                        />
                </div>

                {/* Header Text */}
                <h1 className="signup-header">Sign Up for LostHub</h1>
                
                {/* Error Message Display */}
                {error && <p className="signup-error">{error}</p>}
                
                <form onSubmit={handleSubmit} className="signup-form">
                    
                    {/* Username Field */}
                    <div className="input-group">
                    <label htmlFor="username" className="signup-label">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        className="signup-input"
                        placeholder="Choose a display name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    </div>

                    {/* Email Field */}
                    <div className="input-group">
                    <label htmlFor="email" className="signup-label">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        className="signup-input"
                        placeholder="Your university or personal email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    </div>
                    
                    {/* Password Field */}
                    <div className="input-group">
                    <label htmlFor="password" className="signup-label">Password</label>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="password" 
                        className="signup-input"
                        placeholder="Must be 6 characters minimum"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength="6"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    
                    {/* Show Password Checkbox */}
                    <div className="password-toggle">
                        <input 
                            type="checkbox" 
                            id="showPassword"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        />
                        <label htmlFor="showPassword">Show Password</label>
                    </div>

                    {/* Sign Up Button */}
                    <button type="submit" className="signup-button">
                        {isLoading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>

                

            </div>
        </div>
    );
};

export default SignupPage;