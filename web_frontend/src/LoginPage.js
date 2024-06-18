// src/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css'; // Assuming you save the CSS styles in LoginPage.css

const LoginPage = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/login', loginData);
            alert('Login successful');
            // Redirect or perform additional actions after successful login
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Invalid email or password');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        // Handle signup logic
    };

    return (
        <div className="wrapper">
            <div className="title-text">
                <div className={`title ${isLoginActive ? 'login' : 'signup'}`}>
                    {isLoginActive ? 'Login Form' : 'Signup Form'}
                </div>
            </div>
            <div className="form-container">
                <div className="slide-controls">
                    <input
                        type="radio"
                        name="slide"
                        id="login"
                        checked={isLoginActive}
                        onChange={() => setIsLoginActive(true)}
                    />
                    <input
                        type="radio"
                        name="slide"
                        id="signup"
                        checked={!isLoginActive}
                        onChange={() => setIsLoginActive(false)}
                    />
                    <label htmlFor="login" className="slide login" onClick={() => setIsLoginActive(true)}>
                        Login
                    </label>
                    <label htmlFor="signup" className="slide signup" onClick={() => setIsLoginActive(false)}>
                        Signup
                    </label>
                    <div className="slider-tab" style={{ left: isLoginActive ? '0%' : '50%' }}></div>
                </div>
                <div className="form-inner" style={{ marginLeft: isLoginActive ? '0%' : '-50%' }}>
                    <form onSubmit={handleLogin} className="login">
                        <div className="field">
                            <input
                                type="text"
                                name="email"
                                placeholder="Email Address"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required
                            />
                        </div>
                        <div className="pass-link"><a href="#">Forgot password?</a></div>
                        <div className="field btn">
                            <div className="btn-layer"></div>
                            <input type="submit" value="Login" />
                        </div>
                        <div className="signup-link">
                            Not a member? <a href="#" onClick={() => setIsLoginActive(false)}>Signup now</a>
                        </div>
                    </form>
                    <form onSubmit={handleSignup} className="signup">
                        <div className="field">
                            <input
                                type="text"
                                name="email"
                                placeholder="Email Address"
                                value={signupData.email}
                                onChange={handleSignupChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={signupData.password}
                                onChange={handleSignupChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={signupData.confirmPassword}
                                onChange={handleSignupChange}
                                required
                            />
                        </div>
                        <div className="field btn">
                            <div className="btn-layer"></div>
                            <input type="submit" value="Signup" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
