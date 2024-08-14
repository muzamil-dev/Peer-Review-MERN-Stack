import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardPage.css";
import Api from "../Api.js";
//import snackbar
import { enqueueSnackbar } from "notistack";
import { MdAddCircleOutline } from "react-icons/md";
import { BsBoxArrowRight } from "react-icons/bs";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { ReactComponent as Logo } from "../assets/logo.svg";

const DashboardPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDomains, setNewWorkspaceDomains] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [numGroups, setNumGroups] = useState("");
  const navigate = useNavigate();

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

    const fetchWorkspaces = async () => {
      try {
        const response = await Api.Users.getUserWorkspaces(token);
        if (response.status === 200) {
          setWorkspaces(response.data);
        } else {
          console.error("Failed to fetch workspaces:", response.message);
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };

    fetchWorkspaces();
  }, [navigate]);

  const handleJoinWorkspace = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    try {
      const response = await Api.Workspaces.JoinWorkspace(userId, inviteCode);
      if (response.success) {
        const fetchWorkspaces = async () => {
          try {
            const response = await Api.Users.getUserWorkspaces(token);
            if (response.status === 200) {
              setWorkspaces(response.data);
            } else {
              console.error("Failed to fetch workspaces:", response.message);
            }
          } catch (error) {
            console.error("Error fetching workspaces:", error);
          }
        };
        enqueueSnackbar("Successfully joined workspace.", {
          variant: "success",
        });
        fetchWorkspaces();
      } else {
        enqueueSnackbar("Failed to join workspace.", { variant: "error" });
        //console.error('Failed to join workspace:', response.message);
      }
    } catch (error) {
      enqueueSnackbar("Error joining workspace.", { variant: "error" });
      //console.error('Error joining workspace:', error);
    }
  };

  const handleAddWorkspace = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    // Maximum workspace name length
    const maxWorkspaceNameLength = 25; // Adjust the value as needed

    // Check if the workspace name exceeds the maximum length
    if (newWorkspaceName.length > maxWorkspaceNameLength) {
      enqueueSnackbar(
        `Workspace name exceeds the maximum length of ${maxWorkspaceNameLength} characters.`,
        { variant: "error" }
      );
      return;
    }

    // Add validation for allowed domains
    // Numbers and special characters are not allowed
    // Allowed domains should be separated by commas
    // Should be a "." in each domain and characters before and after the "."
    const domainsArray = newWorkspaceDomains
      .split(",")
      .map((domain) => domain.trim())
      .filter((domain) => domain);

    const isValidDomain = (domain) => {
      const domainRegex = /^[a-zA-Z]+\.[a-zA-Z]+$/;
      return domainRegex.test(domain);
    };

    for (const domain of domainsArray) {
      if (!isValidDomain(domain)) {
        //console.error(`Invalid domain: ${domain}`);
        enqueueSnackbar(`Invalid domain: ${domain}`, { variant: "error" });
        return;
      }
    }

    // Validate that numGroups and maxGroupSize are numbers
    if (numGroups && isNaN(parseInt(numGroups, 10))) {
      enqueueSnackbar("Number of groups must be a valid number.", {
        variant: "error",
      });
      return;
    }

    if (maxGroupSize && isNaN(parseInt(maxGroupSize, 10))) {
      enqueueSnackbar("Max group size must be a valid number.", {
        variant: "error",
      });
      return;
    }

    try {
      //check if name is empty
      if (newWorkspaceName === "") {
        enqueueSnackbar("Workspace name cannot be empty.", {
          variant: "error",
        });
        return;
      }
      const response = await Api.Workspaces.CreateWorkspace(
        newWorkspaceName,
        userId,
        domainsArray,
        maxGroupSize ? parseInt(maxGroupSize, 10) : undefined,
        numGroups ? parseInt(numGroups, 10) : undefined
      );

      if (response.status === 201 || response.status === 200) {
        const fetchWorkspaces = async () => {
          try {
            const response = await Api.Users.getUserWorkspaces(token);
            if (response.status === 200) {
              setWorkspaces(response.data);
            } else {
              console.error("Failed to fetch workspaces:", response.message);
            }
          } catch (error) {
            console.error("Error fetching workspaces:", error);
          }
        };

        const newWorkspace = {
          workspaceId: response.workspaceId,
          name: newWorkspaceName,
          role: "Instructor",
          maxGroupSize: maxGroupSize,
          numGroups: numGroups,
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName("");
        setNewWorkspaceDomains("");
        setInviteCode("");
        setMaxGroupSize("");
        setNumGroups("");
        enqueueSnackbar("Workspace created successfully.", {
          variant: "success",
        });
      } else {
        //console.error('Failed to create workspace:', response.message);
        enqueueSnackbar("Failed to create workspace.", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error creating workspace.", { variant: "error" });
      // console.error('Error creating workspace:', error);
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    const workspace = workspaces.find((w) => w.workspaceId === workspaceId);
    //console.log('Workspace:', workspace); // Log the workspace object
    //console.log('Role:', workspace.role); // Log the role of the user in the workspace
    if (workspace.role === "Instructor") {
      navigate(`/workspaces/${workspaceId}/admin`, {
        state: {
          maxGroupSize: workspace.maxGroupSize,
          numGroups: workspace.numGroups,
        },
      });
    } else {
      navigate(`/groups/${workspaceId}`, {
        state: {
          maxGroupSize: workspace.maxGroupSize,
          numGroups: workspace.numGroups,
        },
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const WorkspaceDisplay = () => {
    if (workspaces.length)
      return workspaces.map((workspace) => (
        <div key={workspace.workspaceId} className="flex sm:justify-center">
          <div
            className="workspace-card card hover:shadow-lg hover:border-white"
            onClick={() => handleWorkspaceClick(workspace.workspaceId)}
          >
            <div className="card-body flex flex-col justify-center">
              <h2 className="card-title text-4xl hover:underline">
                {workspace.name}
              </h2>
              <p className="card-text text-2xl text-start">
                Role: {workspace.role}
              </p>
            </div>
          </div>
        </div>
      ));
    else {
      return (
        <div className="flex flex-col items-center  justify-center mt-4 border bg-white rounded-md p-3 sm:h-56 ">
          <h1 className="text-black text-3xl xl:text-4xl">
          No Workspaces To Show
          </h1>
          <h4 className="text-lg text-slate-500 xl:text-xl">
            Add or Join a Workspace to Display Available Workspaces
          </h4>
        </div>
      );
    }
  };

  const addTooltip = <Tooltip id="add-tooltip">Add Workspace</Tooltip>;

  const joinTooltip = <Tooltip id="join-tooltip">Join Workspace</Tooltip>;

  return (
    <div className="main-contain">
      <nav className="flex items-center  bg-slate-100 p-3 justify-between navigation">
        <div className="flex items-center">
          <a
            className="text-black no-underline text-4xl hover:-translate-y-1"
            href="/"
          >
            <Logo className="w-72"></Logo>
          </a>
        </div>
        <div className="flex gap-6">
          <OverlayTrigger placement="bottom" overlay={addTooltip}>
            <button
              type="button"
              data-toggle="modal"
              data-target="#createWorkspaceModal"
              className="flex border-2 border-slate-100 p-2  rounded-xl bg-green-500 hover:border-green-500 hover:shadow-sm"
            >
              <MdAddCircleOutline className="text-black size-8" />
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={joinTooltip}>
            <button
              type="button"
              data-toggle="modal"
              data-target="#joinWorkspaceModal"
              className="flex border-2 border-slate-100 p-2  bg-green-500 rounded-xl hover:border-green-500 hover:shadow-sm"
            >
              <BsBoxArrowRight className="text-black size-8" />
            </button>
          </OverlayTrigger>
        </div>
      </nav>

      <div className="customContainer">
        <div className="workspace-cards flex flex-col gap-3">
          <div className="workspaces-name mt-3 mb-2 md:ml-6 text-5xl text-white flex justify-center">
            Workspaces
          </div>
          <WorkspaceDisplay />
        </div>
      </div>

      {/* Join Workspace Modal */}
      <div
        className="modal fade"
        id="joinWorkspaceModal"
        tabIndex="-1"
        aria-labelledby="joinWorkspaceModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-3xl" id="joinWorkspaceModalLabel">
                Join Workspace
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Enter code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="form-control mb-2 border-black"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="mb-3 bg-green-600 rounded border p-2 px-3 text-white hover:bg-green-500"
                onClick={handleJoinWorkspace}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <div
        className="modal fade"
        id="createWorkspaceModal"
        tabIndex="-1"
        aria-labelledby="createWorkspaceModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5
                className="modal-title text-3xl"
                id="createWorkspaceModalLabel"
              >
                Add Workspace
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body flex flex-col gap-2">
              <input
                required
                type="text"
                placeholder="Workspace Name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="form-control mb-2 border-black"
              />
              <input
                type="text"
                placeholder="Domain Restrictions (comma separated)"
                value={newWorkspaceDomains}
                onChange={(e) => setNewWorkspaceDomains(e.target.value)}
                className="form-control mb-2 border-black"
              />
              <input
                type="text"
                placeholder="Max Group Size (optional)"
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(e.target.value)}
                className="form-control mb-2 border-black"
              />
              <input
                type="text"
                placeholder="Number of Groups (optional)"
                value={numGroups}
                onChange={(e) => setNumGroups(e.target.value)}
                className="form-control mb-2 border-black"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded border p-2 px-3 bg-green-600 text-white mb-2 hover:bg-green-500 hover"
                onClick={handleAddWorkspace}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
