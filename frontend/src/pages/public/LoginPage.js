import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Crucial for calling login()
import './LoginPage.css'; // Import the dedicated CSS file
import UserIcon from '../../assets/user.png'; // Assuming you save the image here

const LoginPage = () => {
    // State to manage form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Get login function and loading state from context
    const { login, isLoading, user, role} = useAuth();
    const navigate = useNavigate();

    // Function to handle form submission and authentication
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        // Call the login function from AuthContext (which will handle the backend/simulation check)
        // If login returns true (success), navigate. If it returns a string, it's an error message.
        const result = await login(email, password); 
        
        if (result === true) {
             
            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/posts', { replace: true });
            }
        } else {
            // FAILURE: result contains the error message string
            setError(result);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-form-container">
                
                {/* 1. User Icon Logo */}
                <div className="user-logo-container">
                    <img src={UserIcon} 
                         alt="User Icon" 
                         className="user-logo-image" />
                </div>
                
                {/* 2. Header Text */}
                <h1 className="login-header">Login Portal</h1>
                
                {/* 3. Error Message Display */}
                {error && <p className="login-error">{error}</p>}

                <form onSubmit={handleSubmit} className="login-form">
                    
                    {/* Email Field */}
                    <label htmlFor="email" className="login-label">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        className="login-input"
                        placeholder="Your university or personal email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    
                    {/* Password Field */}
                    <label htmlFor="password" className="login-label">Password</label>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="password" 
                        className="login-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    
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

                    {/* Log In Button */}
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Log In'}
                    </button>
                </form>

                {/* 4. Bottom Links Section */}
                <div className="bottom-links-container">
                    {/* Left: Sign Up Link */}
                    <p className="signup-link-text">
                        Not yet have an account? <Link to="/signup" className="link-style">Sign Up</Link>
                    </p>

                </div>

            </div>
        </div>
    );
};

export default LoginPage;