// src/LoginPage.js
import Api from "../Api.js";
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Assuming you save the CSS styles in LoginPage.css

const LoginPage = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupPasswordRequirements, setSignupPasswordRequirements] = useState({ uppercase: false, specialChar: false, number: false, lowercase: false, length: false });
    const [resetPasswordRequirements, setResetPasswordRequirements] = useState({ uppercase: false, specialChar: false, number: false, lowercase: false, length: false });
    const [showSignupPasswordRequirements, setShowSignupPasswordRequirements] = useState(false);
    const [showResetPasswordRequirements, setShowResetPasswordRequirements] = useState(false);
    const [showSignupPasswordsMatch, setShowSignupPasswordsMatch] = useState(false);
    const [showResetPasswordsMatch, setShowResetPasswordsMatch] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [isVerificationActive, setIsVerificationActive] = useState(false);
    const [isResetPasswordActive, setIsResetPasswordActive] = useState(false); 
    const [isRequestResetPasswordActive, setIsRequestResetPasswordActive] = useState(false); 
    const [resetPasswordData, setResetPasswordData] = useState({ email: '', token: '', newPassword: '', confirmNewPassword: '' });
    //const [isLoading, setIsLoading] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    

    const handleVerificationChange = (e) => {
        setVerificationToken(e.target.value);
    };

    const handleResetPasswordChange = (e) => {
        //setResetPasswordData({ ...resetPasswordData, [e.target.name]: e.target.value });

        const { name, value } = e.target;
        setResetPasswordData({ ...resetPasswordData, [name]: value });
        if (name === 'newPassword') {
            checkPasswordComplexity(value, 'reset');
            setShowResetPasswordRequirements(value.length > 0);
        }

        if (name === 'confirmNewPassword') {
            setShowResetPasswordsMatch(true);
        }
    };

    const checkPasswordComplexity = (password, form) => {
        const requirements = {
            uppercase: /[A-Z]/.test(password),
            specialChar: /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
            number: /\d/.test(password),
            lowercase: /[a-z]/.test(password),
            length: password.length >= 8
        };
        if (form === 'signup') {
            setSignupPasswordRequirements(requirements);
        } else if (form === 'reset') {
            setResetPasswordRequirements(requirements);
        }
    };

    const isPasswordValid = (form) => {

        if (form === 'signup') {
            return Object.values(signupPasswordRequirements).every(requirement => requirement);
        } else if (form === 'reset') {
            return Object.values(resetPasswordRequirements).every(requirement => requirement);
        }
        return false;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        //console.log('Login button clicked'); // Debugging log
        try {
            const response = await Api.Users.DoLogin(loginData.email, loginData.password);
            //console.log('Response from API:', response); // Debugging log
            if (response.status === 200) {
                localStorage.setItem('accessToken', response.data.accessToken); // Store JWT in local storage
                enqueueSnackbar('Login successful', { variant: 'success' });
                navigate('/DashboardPage');
            } else {
                enqueueSnackbar('Invalid email or password', { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
            console.error('Error logging in:', error);
        }
    };
    
    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const response = await Api.Users.VerifyEmailCode(tempEmail, verificationToken);
            //console.log('Verification response:', response); // Log the response for debugging
    
            if (response.status === 201) {
                enqueueSnackbar('Verification successful. You can now log in.', { variant: 'success' });
                setIsLoginActive(true);
                setIsVerificationActive(false);
                setVerificationToken('');
                //console.log('Verification successful, switched to login form.');
            } else {
                enqueueSnackbar('Verification Failed', { variant: 'error' });
                console.error('Verification failed:', response.message);
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            enqueueSnackbar(`Verification failed: ${error.message}`, { variant: 'error' });
        }
    };
    
    const handleResetPasswordRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await Api.Users.RequestPasswordReset(resetPasswordData.email);
            if (response.status == 200) {
                enqueueSnackbar('Reset token sent. Please check your email', { variant: 'success' });
                setIsRequestResetPasswordActive(false);
                setIsResetPasswordActive(true);
                //console.log('Reset token sent:', response.message);
                //console.log('Reset password data:', resetPasswordData);
                setResetPasswordData({ ...resetPasswordData, email: resetPasswordData.email });
            } else {
                enqueueSnackbar(response.message, { variant: 'error' });
            }
        } catch (error) {
            console.error('Error requesting reset password:', error);
            enqueueSnackbar(`Error requesting reset password: ${error.message}`, { variant: 'error' });
        }
    };
    
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword) {
            enqueueSnackbar('Passwords do not match', { variant: 'error' });
            return;
        }

        if (!isPasswordValid('reset')) {
            enqueueSnackbar('Password does not meet complexity requirements', { variant: 'error' });
            return;
        }
        try {
            const response = await Api.Users.ResetPassword(resetPasswordData.email, resetPasswordData.token, resetPasswordData.newPassword);
            if (response.status === 201 || response.status === 200) {
                enqueueSnackbar('Password reset successful. You can now log in with your new password.', { variant: 'success' });
                setIsLoginActive(true);
                setIsResetPasswordActive(false);
                setResetPasswordData({ email: '', token: '', newPassword: '', confirmNewPassword: '' });
            } else {
                enqueueSnackbar(response.message, { variant: 'error' });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            enqueueSnackbar(`Error resetting password: ${error.message}`, { variant: 'error' });
        }
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
                            {showResetPasswordRequirements && (
                                    <div className="password-requirements" style={{ paddingTop: '7px' }}>
                                        {!resetPasswordRequirements.uppercase && <p style={{ color: '#004080' }}>At least one uppercase letter is required</p>}
                                        {resetPasswordRequirements.uppercase && !resetPasswordRequirements.specialChar && <p style={{ color: '#004080' }}>At least one special character is required</p>}
                                        {resetPasswordRequirements.uppercase && resetPasswordRequirements.specialChar && !resetPasswordRequirements.number && <p style={{ color: '#004080' }}>At least one number is required</p>}
                                        {resetPasswordRequirements.uppercase && resetPasswordRequirements.specialChar && resetPasswordRequirements.number && !resetPasswordRequirements.lowercase && <p style={{ color: '#004080' }}>At least one lowercase letter is required</p>}
                                        {resetPasswordRequirements.uppercase && resetPasswordRequirements.specialChar && resetPasswordRequirements.number && resetPasswordRequirements.lowercase && !resetPasswordRequirements.length && <p style={{ color: '#004080' }}>At least 8 characters are required</p>}
                                    </div>
                            )}
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
                            {showResetPasswordsMatch && resetPasswordData.confirmNewPassword && resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword && (
                                    <p style={{ color: '#004080', paddingTop: '7px' }}>Passwords do not match</p>
                                )}
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
                        </form>
                    )
                )}

                </div>
            </div>
            {/*{isLoading && <div className="loading">Processing...</div>} {/* Loading indicator */}
        </div>
    );
};

export default LoginPage;
