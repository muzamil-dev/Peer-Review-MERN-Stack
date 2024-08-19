import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import {ReactComponent as Logo} from "./logo.svg";
import { useSnackbar } from "notistack";
import Api from "../Api.js"; // Adjust the import based on your project structure
import { useNavigate } from "react-router-dom";


const LoginPage = () => {
  const [isHeaderShow, setIsHeaderShow] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
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
  const [showResetPasswordRequirements, setShowResetPasswordRequirements] = useState(false);
  const [showResetPasswordsMatch, setShowResetPasswordsMatch] = useState(false);
  const [isResetPasswordActive, setIsResetPasswordActive] = useState(false);
  const [isRequestResetPasswordActive, setIsRequestResetPasswordActive] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1199) {
        setIsHeaderShow(false);
      } else {
        setIsHeaderShow(true);
      }
    };

    const handleScroll = () => {
      const sections = ['welcome', 'login', 'about', 'about', 'faq'];
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) {
        setActiveSection(currentSection);
      }

      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    handleResize();
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleHeader = () => {
    setIsHeaderShow(!isHeaderShow);
  };

  const handleSectionClick = (sectionId) => {
    setIsHeaderShow(false); // Hide the menu after selecting a section
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


const togglePassword = (e) => {
  e.stopPropagation();

  const passwordInput = document.querySelector("#passwordInput");
  const passwordIcon = document.querySelector("#passwordIcon");

  const { length: passwordLength } = passwordInput.value;

  if (passwordIcon.innerText === "visibility") {
    passwordIcon.innerText = "visibility_off";
    passwordInput.type = "text";
  } else {
    passwordIcon.innerText = "visibility";
    passwordInput.type = "password";
  }

  if (passwordLength) {
    passwordInput.focus();
    passwordInput.setSelectionRange(passwordLength, passwordLength);
  }
};

const handleLoginChange = (e) => {
  setLoginData({ ...loginData, [e.target.name]: e.target.value });
};

const handleResetPasswordChange = (e) => {
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
    specialChar: /[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>?~]/.test(password),
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
  try {
    const response = await Api.Users.DoLogin(
      loginData.email,
      loginData.password
    );
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

const handleResetPasswordRequest = async (e) => {
  e.preventDefault();
  try {
    const response = await Api.Users.RequestPasswordReset(
      resetPasswordData.email
    );
    if (response.status == 200 || response.status == 201) {
      enqueueSnackbar("Reset token sent. Please check your email", {
        variant: "success",
      });
      setIsRequestResetPasswordActive(false);
      setIsResetPasswordActive(true);
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
    if (response.status === 201 || response.status === 200) {
      enqueueSnackbar(
        "Password reset successful. You can now log in with your new password.",
        { variant: "success" }
      );
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

const clearInputFields = () => {
  setLoginData({ email: "", password: "" });
  setResetPasswordData({
    email: "",
    token: "",
    newPassword: "",
    confirmNewPassword: "",
  });
};


return (
    <div className="landing-page">
      <header
        id="header"
        className={`header d-flex flex-column justify-content-center ${isHeaderShow ? 'header-show' : ''}`}
      >
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

        <link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css"
/>
        <i
          className={`header-toggle d-xl-none bi ${isHeaderShow ? 'bi-x' : 'bi-list'}`}
          onClick={toggleHeader}
        ></i>
        <nav id="navmenu" className="navmenu">
          <ul>
            {[
              { id: 'welcome', icon: 'house', label: 'Home' },
              { id: 'login', icon: 'box-arrow-in-right', label: 'Login' },
              { id: 'about', icon: 'lightbulb', label: 'About' },
            ].map(({ id, icon, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={activeSection === id ? 'active' : ''}
                  onClick={() => handleSectionClick(id)}
                >
                  <i className={`bi bi-${icon} navicon`}></i>
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="main">

    <section id="welcome" className="section">
        <div className="logo-container">
        <h1 className="text-4xl">Welcome to</h1>
          <Logo className="logo" />
          <div className="btn-container">
          <button className="btn" onClick={() => handleSectionClick('login')}>
            Login
          </button>
          <button className="btn" onClick={() => handleSectionClick('about')}>
            About
          </button>
          </div>
        </div>
    </section>

    <section id="login" className="section">
  <div className="container">
    <h2>Login Form</h2>
    {!isRequestResetPasswordActive && !isResetPasswordActive && (
      <form onSubmit={handleLogin}>
        <div className="textbox email">
          <input
            name="email"
            type="email"
            placeholder=" "
            value={loginData.email}
            onChange={handleLoginChange}
            required
          />
          <label>Email</label>
          <span className="material-symbols-outlined">mail</span>
        </div>
        <div className="textbox password">
          <input
            id="passwordInput"
            name="password"
            type="password"
            placeholder=" "
            value={loginData.password}
            onChange={handleLoginChange}
            required
          />
          <label>Password</label>
          <span className="material-symbols-outlined">lock</span>
          <button
            type="button"
            id="passwordButton"
            onClick={(e) => togglePassword(e)}
          >
            <span
              id="passwordIcon"
              className="material-symbols-outlined"
            >
              visibility
            </span>
          </button>
        </div>
        <div className="pass-link">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              clearInputFields();
              setIsRequestResetPasswordActive(true);
            }}
          >
            Forgot password?
          </button>
        </div>
        <button type="submit">Login</button>
      </form>
    )}
    
    {isRequestResetPasswordActive && !isResetPasswordActive && (
      <form onSubmit={handleResetPasswordRequest}>
        <div className="textbox email">
          <input
            name="email"
            type="email"
            placeholder=" "
            value={resetPasswordData.email}
            onChange={handleResetPasswordChange}
            required
          />
          <label>Email</label>
          <span className="material-symbols-outlined">mail</span>
        </div>
        <div className="pass-link">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              clearInputFields();
              setIsRequestResetPasswordActive(false);
              setIsResetPasswordActive(false);
            }}
            
          >
            Back to Login
          </button>
        </div>
        <button type="submit">Send Reset Token</button>
      </form>
    )}
    
    {isResetPasswordActive && (
      <form onSubmit={handleResetPassword}>
        <div className="textbox token">
          <input
            name="token"
            type="text"
            placeholder=" "
            value={resetPasswordData.token}
            onChange={handleResetPasswordChange}
            required
          />
          <label>Token</label>
          <span className="material-symbols-outlined">verified</span>
        </div>
        <div className="textbox password">
          <input
            id="newPasswordInput"
            name="newPassword"
            type="password"
            placeholder=" "
            value={resetPasswordData.newPassword}
            onChange={handleResetPasswordChange}
            required
          />
          <label>New Password</label>
          <span className="material-symbols-outlined">lock</span>
        </div>

        {showResetPasswordRequirements && (
          <div className="password-requirements" >
            {!resetPasswordRequirements.uppercase && (
              <p style={{ color: "white" }}>At least one uppercase letter is required</p>
            )}
            {resetPasswordRequirements.uppercase &&
              !resetPasswordRequirements.specialChar && (
                <p style={{ color: "white" }}>At least one special character is required</p>
              )}
            {resetPasswordRequirements.uppercase &&
              resetPasswordRequirements.specialChar &&
              !resetPasswordRequirements.number && (
                <p style={{ color: "white" }}>At least one number is required</p>
              )}
            {resetPasswordRequirements.uppercase &&
              resetPasswordRequirements.specialChar &&
              resetPasswordRequirements.number &&
              !resetPasswordRequirements.lowercase && (
                <p style={{ color: "white" }}>At least one lowercase letter is required</p>
              )}
            {resetPasswordRequirements.uppercase &&
              resetPasswordRequirements.specialChar &&
              resetPasswordRequirements.number &&
              resetPasswordRequirements.lowercase &&
              !resetPasswordRequirements.length && (
                <p style={{ color: "white" }}>At least 8 characters are required</p>
              )}
          </div>
        )}

        <div className="textbox password">
          <input
            id="confirmNewPasswordInput"
            name="confirmNewPassword"
            type="password"
            placeholder=" "
            value={resetPasswordData.confirmNewPassword}
            onChange={handleResetPasswordChange}
            required
          />
          <label>Confirm Password</label>
          <span className="material-symbols-outlined">lock</span>
        </div>
        
        {showResetPasswordsMatch &&
          resetPasswordData.confirmNewPassword &&
          resetPasswordData.newPassword !== resetPasswordData.confirmNewPassword && (
            <p style={{ color: 'white' }}>
              Passwords do not match
            </p>
          )}

        <div className="pass-link">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              clearInputFields();
              setIsRequestResetPasswordActive(false);
              setIsResetPasswordActive(false);
            }}
            
          >
            Back to Login
          </button>
        </div>
        <button type="submit">Reset Password</button>
      </form>
    )}
  </div>
</section>


<section id="about" className="section">
  <div className="container">
    <div className="about-content">
      <h2 className="section-title">About</h2>
      <p>
      Rate My Peer is an essential tool in group-based learning environments, allowing instructors to gain valuable insights into the dynamics within student teams. Through regular questionnaires, students can provide feedback on their peers, helping to identify strengths, areas for improvement, and potential issues early on. This process not only promotes accountability and transparency but also fosters a culture of continuous improvement and collaboration within the group.
      </p>
      <p>
      This project was developed during one of our own group-based courses. As we delved deeper into the development process, we became increasingly aware of the critical role that effective peer feedback plays in the success of a team. The more we collaborated, the more we recognized the importance of strong team values—values that encourage open communication, mutual respect, and shared responsibility. We believe that when a team embodies these principles, they are more likely to overcome challenges and achieve success together.
      </p>
    </div>
  </div>
</section>

</main>

      {showScrollTop && (
      <button className="scroll-to-top" onClick={scrollToTop}>
      <i className="bi bi-arrow-up"></i>
    </button>
    )}


    </div>
    
  );
};

export default LoginPage;
