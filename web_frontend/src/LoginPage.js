// src/LoginPage.js
import Api from "./Api.js";
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css'; // Assuming you save the CSS styles in LoginPage.css

const LoginPage = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    //const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });
    const [signupData, setSignupData] = useState({ firstName: '', middleName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    const navigate = useNavigate();

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await Api.Users.DoLogin(loginData.email, loginData.password);
            if (response.status === 200) {
                alert('Login successful');
                navigate('/DashboardPage');
            // Redirect or perform additional actions after successful login
            }
            else {
                alert('Invalid email or password');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            //alert('Invalid email or password-2');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (signupData.password !== signupData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        //console.log('Signup Data:', signupData); // Log the signup data

        try {
            const response = await Api.Users.CreateAccount(
                signupData.firstName,
                signupData.middleName,
                signupData.lastName,
                signupData.email,
                signupData.password
            );
            if (response.status === 201) {
                alert('Signup successful');
                navigate('/DashboardPage');
            } else {
                alert('Signup failed');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Signup failed');
        }
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
                <div className="form-inner" style={{ marginLeft: isLoginActive ? '0%' : '-100%' }}>
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
                        <div className="field-row">
                            <div className="field">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={signupData.firstName}
                                    onChange={handleSignupChange}
                                    //required
                                />
                            </div>
                            <div className="field">
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={signupData.lastName}
                                    onChange={handleSignupChange}
                                    //required
                                />
                            </div>
                        </div>
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
