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
    const [verificationToken, setVerificationToken] = useState('');
    const [isVerificationActive, setIsVerificationActive] = useState(false);
    const [isResetPasswordActive, setIsResetPasswordActive] = useState(false); 
    const [isRequestResetPasswordActive, setIsRequestResetPasswordActive] = useState(false); 
    const [resetPasswordData, setResetPasswordData] = useState({ email: '', token: '', newPassword: '', confirmNewPassword: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const navigate = useNavigate();

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleVerificationChange = (e) => {
        setVerificationToken(e.target.value);
    };

    const handleResetPasswordChange = (e) => {
        setResetPasswordData({ ...resetPasswordData, [e.target.name]: e.target.value });
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
        //setIsLoading(true);

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
                //navigate('/DashboardPage');
                setTempEmail(signupData.email);
                setIsVerificationActive(true);
            } else {
                alert('Signup failed');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Signup failed');
        }
        //setIsLoading(false);
    };

    /**/
    const handleVerify = async (e) => {
        e.preventDefault();
        //setIsLoading(true);
        try {
            const response = await Api.Users.VerifyToken(tempEmail, verificationToken);
            if (response.status === 200) {
                alert('Verification successful. You can now log in.');
                setIsLoginActive(true);
                setIsVerificationActive(false);
                setSignupData({ firstName: '', middleName: '', lastName: '', email: '', password: '', confirmPassword: '' });
                setVerificationToken('');
            } else {
                alert('Verification failed');
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            alert('Verification failed');
        }
        //setIsLoading(false);
    }; 
    
    const handleResetPasswordRequest = async (e) => {
        e.preventDefault();
        //setIsLoading(true);
        try {
            const response = await Api.Users.RequestPasswordReset(resetPasswordData.email);
            if (response.status === 200) {
                alert('Reset token sent. Please check your email.');
                setIsRequestResetPasswordActive(false);
                setIsResetPasswordActive(true);
                setResetPasswordData({ ...resetPasswordData, email: resetPasswordData.email });
            } else {
                alert('This email is not registered.');
            }
        } catch (error) {
            console.error('Error requesting reset password:', error);
            alert('Error requesting reset password');
        }
        //setIsLoading(false); // End loading
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword) {
            alert('Passwords do not match');
            return;
        }
        //setIsLoading(true); // Start loading
        try {
            const response = await Api.Users.ResetPassword(resetPasswordData.email, resetPasswordData.token, resetPasswordData.newPassword);
            if (response.status === 200) {
                alert('Password reset successful. You can now log in with your new password.');
                setIsLoginActive(true);
                setIsResetPasswordActive(false);
                setResetPasswordData({ email: '', token: '', newPassword: '', confirmNewPassword: '' }); // Reset resetPasswordData
            } else {
                alert('Password reset failed. Please check the token and try again.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Error resetting password');
        }
        //setIsLoading(false);
    };
    
    /**/

    return (
        <div className="wrapper">
            <div className="title-text">
            <div className={`title ${isLoginActive ? 'login' : (isVerificationActive ? 'Verify Account' : 'Signup Form')}`}>
                    {isLoginActive ? 'Login Form' : (isVerificationActive ? 'Verify Account' : 'Signup Form')}
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
                
            
                
                {isRequestResetPasswordActive ? (

                    <form onSubmit={handleResetPasswordRequest} className="request reset password ">
                        <div className="field">
                            <input
                                type="text"
                                name="email"
                                placeholder="Email Address"
                                value={resetPasswordData.email}
                                onChange={handleResetPasswordChange}
                                required
                            />
                        </div>
                    
                        <div className="field btn">
                            <div className="btn-layer"></div>
                            <input type="submit" value="Send email" />
                        </div>
                        <div className="signup-link">
                             <a href="#" onClick={() => setIsRequestResetPasswordActive(false)}> Back to sign in</a>
                        </div>
                        </form>
                        
                    
                    ) : (
                        isResetPasswordActive ? (
                            <form onSubmit={handleResetPassword} className="reset-password">
                            <div className="field">
                                <input
                                    type="text"
                                    name="token"
                                    placeholder="Reset Token"
                                    value={resetPasswordData.token}
                                    onChange={handleResetPasswordChange}
                                    required
                                />
                            </div>
                            <div className="field">
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="New Password"
                                    value={resetPasswordData.newPassword}
                                    onChange={handleResetPasswordChange}
                                    required
                                />
                            </div>
                            <div className="field">
                                <input
                                    type="password"
                                    name="confirmNewPassword"
                                    placeholder="Confirm New Password"
                                    value={resetPasswordData.confirmNewPassword}
                                    onChange={handleResetPasswordChange}
                                    required
                                />
                            </div>
                            <div className="field btn">
                                <div className="btn-layer"></div>
                                <input type="submit" value="Reset Password" />
                            </div>
                        </form>
                    ) : (

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
                        <div className="pass-link">
                            <a href="#" onClick={() => setIsRequestResetPasswordActive(true)}>Forgot password?</a>
                            </div>
                        <div className="field btn">
                            <div className="btn-layer"></div>
                            <input type="submit" value="Login" />
                        </div>
                        <div className="signup-link">
                            Not a member? <a href="#" onClick={() => setIsLoginActive(false)}>Signup now</a>
                        </div>
                        </form>
                    )
                )}

                {isVerificationActive ? ( /**/
                <form onSubmit={handleVerify} className="verify">
                            <div className="field">
                                <input
                                    type="text"
                                    name="token"
                                    placeholder="Verification Token"
                                    value={verificationToken}
                                    onChange={handleVerificationChange}
                                    required
                                />
                            </div>
                            <div className="field btn">
                                <div className="btn-layer"></div>
                                <input type="submit" value="Verify" />
                            </div>
                            <div className="signup-link">
                            Incorrect email? <a href="#" onClick={() => setIsVerificationActive(false)}>Back to sign up</a>
                        </div>
                        </form>
                ):(
                    
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
                )}
                </div>
            </div>
            {/*{isLoading && <div className="loading">Processing...</div>} {/* Loading indicator */}
        </div>
    );
};

export default LoginPage;
