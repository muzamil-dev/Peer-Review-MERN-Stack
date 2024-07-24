import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "../styles/navbar.css";

const Navbar = ({ pageTitle = "Workspaces"}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    //console.log('Token:', token); // Log the token
    const decodedToken = jwtDecode(token);
    //console.log('Decoded Token:', decodedToken); // Log the decoded token
    const userId = decodedToken.userId;
    //console.log('User ID:', userId); // Log the userId

    if (!userId) {
      console.error("User ID not found in token");
      navigate("/");
      return;
    }
  }, [navigate]);

  return (
    <nav className="flex items-center border-cyan-100 border ">
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
      </svg>
      <a className="text-white text-4xl " href="/">
        {pageTitle}
      </a>
    </nav>
  );
};

export default Navbar;
