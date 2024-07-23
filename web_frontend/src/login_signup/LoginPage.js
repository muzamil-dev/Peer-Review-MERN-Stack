// src/LoginPage.js
import Api from "../Api.js";
import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Assuming you save the CSS styles in LoginPage.css

const LoginPage = () => {
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signupPasswordRequirements, setSignupPasswordRequirements] = useState({
    uppercase: false,
    specialChar: false,
    number: false,
    lowercase: false,
    length: false,
  });
  const [resetPasswordRequirements, setResetPasswordRequirements] = useState({
    uppercase: false,
    specialChar: false,
    number: false,
    lowercase: false,
    length: false,
  });
  const [showSignupPasswordRequirements, setShowSignupPasswordRequirements] =
    useState(false);
  const [showResetPasswordRequirements, setShowResetPasswordRequirements] =
    useState(false);
  const [showSignupPasswordsMatch, setShowSignupPasswordsMatch] =
    useState(false);
  const [showResetPasswordsMatch, setShowResetPasswordsMatch] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [isVerificationActive, setIsVerificationActive] = useState(false);
  const [isResetPasswordActive, setIsResetPasswordActive] = useState(false);
  const [isRequestResetPasswordActive, setIsRequestResetPasswordActive] =
    useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  //const [isLoading, setIsLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData({ ...signupData, [name]: value });

    if (name === "password") {
      checkPasswordComplexity(value, "signup");
      setShowSignupPasswordRequirements(value.length > 0);
    }

    if (name === "confirmPassword") {
      setShowSignupPasswordsMatch(true);
    }
  };

  const handleVerificationChange = (e) => {
    setVerificationToken(e.target.value);
  };

  const handleResetPasswordChange = (e) => {
    //setResetPasswordData({ ...resetPasswordData, [e.target.name]: e.target.value });

    const { name, value } = e.target;
    setResetPasswordData({ ...resetPasswordData, [name]: value });
    if (name === "newPassword") {
      checkPasswordComplexity(value, "reset");
      setShowResetPasswordRequirements(value.length > 0);
    }

    if (name === "confirmNewPassword") {
      setShowResetPasswordsMatch(true);
    }
  };

  const checkPasswordComplexity = (password, form) => {
    const requirements = {
      uppercase: /[A-Z]/.test(password),
      specialChar: /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
      number: /\d/.test(password),
      lowercase: /[a-z]/.test(password),
      length: password.length >= 8,
    };
    if (form === "signup") {
      setSignupPasswordRequirements(requirements);
    } else if (form === "reset") {
      setResetPasswordRequirements(requirements);
    }
  };

  const isPasswordValid = (form) => {
    if (form === "signup") {
      return Object.values(signupPasswordRequirements).every(
        (requirement) => requirement
      );
    } else if (form === "reset") {
      return Object.values(resetPasswordRequirements).every(
        (requirement) => requirement
      );
    }
    return false;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    //console.log('Login button clicked'); // Debugging log
    try {
      const response = await Api.Users.DoLogin(
        loginData.email,
        loginData.password
      );
      //console.log('Response from API:', response); // Debugging log
      if (response.status === 200) {
        localStorage.setItem("accessToken", response.data.accessToken); // Store JWT in local storage
        enqueueSnackbar("Login successful", { variant: "success" });
        navigate("/DashboardPage");
      } else {
        enqueueSnackbar("Invalid email or password", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar(`Error: ${error.message}`, { variant: "error" });
      console.error("Error logging in:", error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    //console.log('Signup button clicked'); // Add this line for debugging
    if (signupData.password !== signupData.confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }

    if (!isPasswordValid("signup")) {
      enqueueSnackbar("Password does not meet complexity requirements", {
        variant: "error",
      });
      return;
    }

    //console.log('Signup Data:', signupData); // Log the signup data for debugging

    try {
      const response = await Api.Users.CreateAccount(
        signupData.firstName,
        signupData.lastName,
        signupData.email,
        signupData.password
      );
      //console.log('Response from API:', response); // Add this line for debugging
      if (response.status === 201) {
        enqueueSnackbar("Verification token sent to email", {
          variant: "success",
        });
        setTempEmail(signupData.email);
        setIsVerificationActive(true);
      } else {
        enqueueSnackbar(`${response.message}`, { variant: "error" });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      enqueueSnackbar(`Error signing up: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await Api.Users.VerifyEmailCode(
        tempEmail,
        verificationToken
      );
      //console.log('Verification response:', response); // Log the response for debugging

      if (response.status === 201) {
        enqueueSnackbar("Verification successful. You can now log in.", {
          variant: "success",
        });
        setIsLoginActive(true);
        setIsVerificationActive(false);
        setSignupData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setVerificationToken("");
        //console.log('Verification successful, switched to login form.');
      } else {
        enqueueSnackbar("Verification Failed", { variant: "error" });
        console.error("Verification failed:", response.message);
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      enqueueSnackbar(`Verification failed: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleResetPasswordRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await Api.Users.RequestPasswordReset(
        resetPasswordData.email
      );
      if (response.success) {
        enqueueSnackbar("Reset token sent. Please check your email", {
          variant: "success",
        });
        setIsRequestResetPasswordActive(false);
        setIsResetPasswordActive(true);
        //console.log('Reset token sent:', response.message);
        //console.log('Reset password data:', resetPasswordData);
        setResetPasswordData({
          ...resetPasswordData,
          email: resetPasswordData.email,
        });
      } else {
        enqueueSnackbar(response.message, { variant: "error" });
      }
    } catch (error) {
      console.error("Error requesting reset password:", error);
      enqueueSnackbar(`Error requesting reset password: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (
      resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword
    ) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }

    if (!isPasswordValid("reset")) {
      enqueueSnackbar("Password does not meet complexity requirements", {
        variant: "error",
      });
      return;
    }
    try {
      const response = await Api.Users.ResetPassword(
        resetPasswordData.email,
        resetPasswordData.token,
        resetPasswordData.newPassword
      );
      if (response.status === 201) {
        enqueueSnackbar(
          "Password reset successful. You can now log in with your new password.",
          { variant: "success" }
        );
        setIsLoginActive(true);
        setIsResetPasswordActive(false);
        setResetPasswordData({
          email: "",
          token: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        enqueueSnackbar(response.message, { variant: "error" });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      enqueueSnackbar(`Error resetting password: ${error.message}`, {
        variant: "error",
      });
    }
  };
  /**/

  return (
    <>
      <div className="logo-container">
        <h1>Welcome To</h1>
        <svg
          className="logo looka-1j8o68f"
          width="533.0000000000001"
          height="82.2294974960152"
          viewBox="0 0 369.65517241379314 57.02919150917273"
        >
          <defs id="SvgjsDefs1011"></defs>
          <g
            id="SvgjsG1012"
            featurekey="odWo6G-0"
            transform="matrix(0.6553187074320751,0,0,0.6553187074320751,-1.2824166930921443,-2.94033410034786)"
            fill="#FFFFFF"
          >
            <path
              xmlns="http://www.w3.org/2000/svg"
              d="M28.036,91.512c-0.38,0-0.764-0.104-1.096-0.324c-0.708-0.467-1.048-1.332-0.844-2.155l3.552-14.353H15.872  c-0.944,0-1.764-0.656-1.956-1.584L2,16.368c-0.116-0.556,0.004-1.132,0.34-1.588c0.332-0.456,0.84-0.752,1.404-0.813L91.828,4.5  c0.607-0.072,1.22,0.156,1.648,0.592c0.428,0.436,0.631,1.056,0.547,1.66l-7.836,58.191c-0.136,0.992-0.979,1.736-1.983,1.736  H61.216L29.256,91.1C28.892,91.376,28.464,91.512,28.036,91.512L28.036,91.512z"
            ></path>
          </g>
          <g
            id="SvgjsG1013"
            featurekey="VGK2BT-0"
            transform="matrix(2.604824210880463,0,0,2.604824210880463,77.35178196690569,-12.777177113821839)"
            fill="#FFFFFF"
          >
            <path d="M11.186 19.67797 c0.11864 0.16949 0.034064 0.32203 -0.1861 0.32203 l-1.2544 0 c-0.37288 0 -0.67814 -0.33881 -0.81356 -0.5422 l-2.6441 -3.8983 l-3.3559 0 l0 4.1525 c0 0.18644 -0.10169 0.28797 -0.27119 0.28797 l-1.3729 0 c-0.16949 0 -0.27119 -0.10153 -0.27119 -0.28797 l0 -13 c0 -0.15254 0.10169 -0.27119 0.27119 -0.27119 l5.2203 0 c2.9659 0 4.5592 2.5254 4.5592 4.5592 c0 1.6949 -1.0168 3.5934 -2.9322 4.2881 z M2.9324 8.288 l0 5.4237 l3.3559 0 c1.9153 0 2.8644 -1.3729 2.8644 -2.7458 c0 -1.3559 -0.9661 -2.678 -2.8644 -2.678 l-3.3559 0 z M20.220150847457624 19.62712 c-0.22034 -1.661 -0.2368 -3.2032 -0.16916 -4.8302 c0.084746 -2 -1.0169 -3.2881 -3.0847 -3.2881 c-1.3559 0 -2.7627 0.40678 -3.5932 0.86441 c-0.15254 0.084746 -0.25424 0.23712 -0.18644 0.38966 l0.42373 0.98305 c0.067797 0.16949 0.18644 0.22034 0.40678 0.11864 c1.0847 -0.49153 1.9661 -0.72881 2.8305 -0.72881 c0.91525 0 1.4576 0.35593 1.4237 1.322 c-3.1356 0.5422 -5.5254 1.1015 -5.5254 3.3049 c0 1.4746 1.0678 2.3219 2.7966 2.3219 c1.4408 0 2.1864 -0.44051 2.8983 -0.98288 c0.08458 0.50847 0.23712 0.89831 0.5761 0.89831 l1.0169 0 c0.15238 0 0.20322 -0.18644 0.18627 -0.37288 z M15.864550847457625 18.627299999999998 c-0.69492 0 -1.2373 -0.23729 -1.2373 -0.88136 c0 -1.0339 1.8981 -1.3729 3.6102 -1.7288 c-0.016949 0.55932 -0.016949 1.3051 0 1.7966 c-0.55932 0.42373 -1.5085 0.81356 -2.3729 0.81356 z M27.033705084745765 19.4578 c0.050847 0.13559 -0.050681 0.22 -0.16933 0.30475 c-0.28814 0.18644 -0.91525 0.32203 -1.5424 0.32203 c-1.8136 0 -2.4746 -0.9322 -2.4746 -3.1186 l0 -3.5763 l-1 0 c-0.15254 0 -0.27119 -0.10169 -0.27119 -0.27119 l0 -0.28814 c0 -0.13559 0.033898 -0.23712 0.13559 -0.33898 c0.98305 -0.79661 1.7627 -1.6269 2.4407 -3.339 c0.050847 -0.11864 0.10169 -0.18644 0.18644 -0.18644 l0.18644 0 c0.13559 0 0.18644 0.067797 0.18644 0.22034 l0 2.4237 l1.7797 0 c0.15254 0 0.28814 0.11881 0.28814 0.28831 l0 1.2203 c0 0.15254 -0.13559 0.27119 -0.28814 0.27119 l-1.4746 0 c-0.13559 0 -0.25424 -0.016949 -0.32203 -0.050847 l0 3.4576 c0 0.98305 0.11864 1.5424 0.94915 1.5424 c0.35593 0 0.59322 -0.050847 0.79661 -0.10169 s0.33898 0.033898 0.37288 0.22051 z M35.54236610169492 16.4915 c0.61 0 1.0336 -0.30508 1.0336 -1.0169 c0 -2.0847 -1.6102 -3.9831 -4.0847 -3.9831 c-2.3559 0 -4.2034 1.8644 -4.2034 4.3051 c0 2.5422 1.9322 4.288 4.3051 4.288 c1.5085 0 2.6949 -0.61017 3.4237 -1.5932 c0.10186 -0.13559 0.067963 -0.23729 -0.033568 -0.37288 l-0.32203 -0.42373 c-0.13559 -0.16933 -0.27119 -0.15254 -0.44085 -0.050847 c-0.5422 0.44068 -1.4405 0.81373 -2.4236 0.81373 c-1.3898 0 -2.3729 -0.84746 -2.5593 -1.9661 l5.3051 0 z M30.237166101694918 15.050799999999999 c0.067797 -0.81356 0.83051 -1.8644 2.2203 -1.8644 c1.4068 0 2.1356 1.0678 2.1864 1.8644 l-4.4068 0 z M58.40640677966102 6.441000000000001 c0.15254 0 0.27168 0.11881 0.27168 0.28847 l0 12.983 c0 0.15254 -0.10169 0.28797 -0.27136 0.28797 l-1.339 0 c-0.18644 0 -0.28814 -0.11864 -0.28814 -0.28814 l0 -9.339 l-5.5254 9.0339 c-0.084746 0.13559 -0.16949 0.20339 -0.30508 0.20339 l-0.08458 0 c-0.13559 0 -0.22034 -0.067797 -0.30508 -0.20339 l-5.5085 -9.0339 l0 9.339 c0 0.15254 -0.11881 0.28797 -0.28831 0.28797 l-1.339 0 c-0.16949 0 -0.28831 -0.11864 -0.28831 -0.28814 l0 -13 c0 -0.15254 0.10186 -0.27119 0.27119 -0.27119 l1.1525 0 c0.15254 0 0.25424 0.050847 0.33898 0.18644 l6.0169 9.8307 l6.0168 -9.8307 c0.067797 -0.13559 0.16949 -0.18644 0.33898 -0.18644 l1.1356 0 z M69.06775254237289 11.6102 c0.20339 0 0.30525 0.13543 0.20356 0.32203 l-3.3559 6.8983 c-1.678 3.4914 -3.1525 5.5083 -3.9492 6.288 c-0.15254 0.13559 -0.33898 0.067797 -0.50847 -0.10169 l-0.72881 -0.72881 c-0.18644 -0.16949 -0.15254 -0.33898 0.016949 -0.54237 c1.0339 -1.1695 2.3729 -3.1017 3.2373 -5.0507 l-3.5254 -6.7797 c-0.084746 -0.16949 0 -0.30508 0.18644 -0.30508 l1.4915 0 c0.15238 0 0.23712 0.067797 0.30492 0.18661 l2.4915 5.0846 l2.3729 -5.0678 c0.067797 -0.13559 0.16949 -0.20339 0.32203 -0.20339 l1.4407 0 z M80.88117966101696 6.441000000000001 c2.9492 0 4.6442 2.4915 4.6442 4.5424 c0 2.1695 -1.6949 4.5763 -4.6441 4.5763 l-3.3729 0 l0 4.1525 c0 0.18644 -0.10153 0.28797 -0.27119 0.28797 l-1.3729 0 c-0.16949 0 -0.27119 -0.10153 -0.27119 -0.28797 l0 -13 c0 -0.15254 0.10169 -0.27119 0.27119 -0.27119 l5.0168 0 z M80.72897966101695 13.712 c1.8644 0 2.8983 -1.3729 2.8983 -2.7288 c0 -1.339 -1.0339 -2.6949 -2.8983 -2.6949 l-3.2203 0 l0 5.4237 l3.2203 0 z M93.89829830508475 16.4915 c0.61 0 1.0336 -0.30508 1.0336 -1.0169 c0 -2.0847 -1.6102 -3.9831 -4.0847 -3.9831 c-2.3559 0 -4.2034 1.8644 -4.2034 4.3051 c0 2.5422 1.9322 4.288 4.3051 4.288 c1.5085 0 2.6949 -0.61017 3.4237 -1.5932 c0.10186 -0.13559 0.067963 -0.23729 -0.033568 -0.37288 l-0.32203 -0.42373 c-0.13559 -0.16933 -0.27119 -0.15254 -0.44085 -0.050847 c-0.5422 0.44068 -1.4405 0.81373 -2.4236 0.81373 c-1.3898 0 -2.3729 -0.84746 -2.5593 -1.9661 l5.3051 0 z M88.59309830508475 15.050799999999999 c0.067797 -0.81356 0.83051 -1.8644 2.2203 -1.8644 c1.4068 0 2.1356 1.0678 2.1864 1.8644 l-4.4068 0 z M103.42372203389831 16.4915 c0.61 0 1.0336 -0.30508 1.0336 -1.0169 c0 -2.0847 -1.6102 -3.9831 -4.0847 -3.9831 c-2.3559 0 -4.2034 1.8644 -4.2034 4.3051 c0 2.5422 1.9322 4.288 4.3051 4.288 c1.5085 0 2.6949 -0.61017 3.4237 -1.5932 c0.10186 -0.13559 0.067963 -0.23729 -0.033568 -0.37288 l-0.32203 -0.42373 c-0.13559 -0.16933 -0.27119 -0.15254 -0.44085 -0.050847 c-0.5422 0.44068 -1.4405 0.81373 -2.4236 0.81373 c-1.3898 0 -2.3729 -0.84746 -2.5593 -1.9661 l5.3051 0 z M98.11852203389832 15.050799999999999 c0.067797 -0.81356 0.83051 -1.8644 2.2203 -1.8644 c1.4068 0 2.1356 1.0678 2.1864 1.8644 l-4.4068 0 z M112.03374576271187 12.034099999999999 c0.18644 0.11864 0.23729 0.22017 0.11848 0.40661 l-0.69475 1.0169 c-0.084746 0.11864 -0.20339 0.15254 -0.35593 0.11864 c-0.35593 -0.16949 -0.66102 -0.32203 -1.2203 -0.32203 s-1.4407 0.23729 -1.9153 1.2881 l0 5.1866 c0 0.15238 -0.10169 0.27102 -0.25424 0.27102 l-1.339 0 c-0.15254 0 -0.25424 -0.11864 -0.25424 -0.27102 l0 -7.8476 c0 -0.15238 0.11864 -0.27119 0.25424 -0.27119 l0.9322 0 c0.40678 0 0.66102 0.42373 0.66102 0.72881 l0 0.11881 c0.59322 -0.54237 1.3051 -0.91525 2.2373 -0.91525 c0.86441 0 1.5085 0.27119 1.8305 0.49153 z"></path>
          </g>
        </svg>
      </div>
      <div className="wrapper">
        <div className="title-text">
          <div
            className={`title ${
              isLoginActive
                ? "login"
                : isVerificationActive
                ? "Verify Account"
                : "Signup Form"
            }`}
          >
            {isLoginActive
              ? "Login Form"
              : isVerificationActive
              ? "Verify Account"
              : "Signup Form"}
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
            <label
              htmlFor="login"
              className="slide login"
              onClick={() => setIsLoginActive(true)}
            >
              Login
            </label>
            <label
              htmlFor="signup"
              className="slide signup"
              onClick={() => setIsLoginActive(false)}
            >
              Signup
            </label>
            <div
              className="slider-tab"
              style={{ left: isLoginActive ? "0%" : "50%" }}
            ></div>
          </div>
          <div
            className="form-inner"
            style={{ marginLeft: isLoginActive ? "0%" : "-100%" }}
          >
            {isRequestResetPasswordActive ? (
              <form
                onSubmit={handleResetPasswordRequest}
                className="request reset password "
              >
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
                  <a
                    href="#"
                    onClick={() => setIsRequestResetPasswordActive(false)}
                  >
                    {" "}
                    Back to sign in
                  </a>
                </div>
              </form>
            ) : isResetPasswordActive ? (
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
                  <div
                    className="password-requirements"
                    style={{ paddingTop: "7px" }}
                  >
                    {!resetPasswordRequirements.uppercase && (
                      <p style={{ color: "#004080" }}>
                        At least one uppercase letter is required
                      </p>
                    )}
                    {resetPasswordRequirements.uppercase &&
                      !resetPasswordRequirements.specialChar && (
                        <p style={{ color: "#004080" }}>
                          At least one special character is required
                        </p>
                      )}
                    {resetPasswordRequirements.uppercase &&
                      resetPasswordRequirements.specialChar &&
                      !resetPasswordRequirements.number && (
                        <p style={{ color: "#004080" }}>
                          At least one number is required
                        </p>
                      )}
                    {resetPasswordRequirements.uppercase &&
                      resetPasswordRequirements.specialChar &&
                      resetPasswordRequirements.number &&
                      !resetPasswordRequirements.lowercase && (
                        <p style={{ color: "#004080" }}>
                          At least one lowercase letter is required
                        </p>
                      )}
                    {resetPasswordRequirements.uppercase &&
                      resetPasswordRequirements.specialChar &&
                      resetPasswordRequirements.number &&
                      resetPasswordRequirements.lowercase &&
                      !resetPasswordRequirements.length && (
                        <p style={{ color: "#004080" }}>
                          At least 8 characters are required
                        </p>
                      )}
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
                {showResetPasswordsMatch &&
                  resetPasswordData.confirmNewPassword &&
                  resetPasswordData.newPassword !==
                    resetPasswordData.confirmNewPassword && (
                    <p style={{ color: "#004080", paddingTop: "7px" }}>
                      Passwords do not match
                    </p>
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
                  <a
                    href="#"
                    onClick={() => setIsRequestResetPasswordActive(true)}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="field btn">
                  <div className="btn-layer"></div>
                  <input type="submit" value="Login" />
                </div>
                <div className="signup-link">
                  Not a member?{" "}
                  <a href="#" onClick={() => setIsLoginActive(false)}>
                    Signup now
                  </a>
                </div>
              </form>
            )}

            {isVerificationActive /**/ ? (
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
                  Incorrect email?{" "}
                  <a href="#" onClick={() => setIsVerificationActive(false)}>
                    Back to sign up
                  </a>
                </div>
              </form>
            ) : (
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
                {showSignupPasswordRequirements && (
                  <div
                    className="password-requirements"
                    style={{ paddingTop: "7px" }}
                  >
                    {!signupPasswordRequirements.uppercase && (
                      <p style={{ color: "#004080" }}>
                        At least one uppercase letter is required
                      </p>
                    )}
                    {signupPasswordRequirements.uppercase &&
                      !signupPasswordRequirements.specialChar && (
                        <p style={{ color: "#004080" }}>
                          At least one special character is required
                        </p>
                      )}
                    {signupPasswordRequirements.uppercase &&
                      signupPasswordRequirements.specialChar &&
                      !signupPasswordRequirements.number && (
                        <p style={{ color: "#004080" }}>
                          At least one number is required
                        </p>
                      )}
                    {signupPasswordRequirements.uppercase &&
                      signupPasswordRequirements.specialChar &&
                      signupPasswordRequirements.number &&
                      !signupPasswordRequirements.lowercase && (
                        <p style={{ color: "#004080" }}>
                          At least one lowercase letter is required
                        </p>
                      )}
                    {signupPasswordRequirements.uppercase &&
                      signupPasswordRequirements.specialChar &&
                      signupPasswordRequirements.number &&
                      signupPasswordRequirements.lowercase &&
                      !signupPasswordRequirements.length && (
                        <p style={{ color: "#004080" }}>
                          At least 8 characters are required
                        </p>
                      )}
                  </div>
                )}
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
                {showSignupPasswordsMatch &&
                  signupData.confirmPassword &&
                  signupData.password !== signupData.confirmPassword && (
                    <p style={{ color: "#004080", paddingTop: "7px" }}>
                      Passwords do not match
                    </p>
                  )}
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
    </>
  );
};

export default LoginPage;
