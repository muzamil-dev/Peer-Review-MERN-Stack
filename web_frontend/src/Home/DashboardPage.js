import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardPage.css";
import Api from "../Api.js";
//import snackbar
import { enqueueSnackbar } from "notistack";

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
          role: "Admin",
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

  return (
    <div className="dashboard">
      <div className="container customContainer">
        <div className="row workspace-cards">
          {workspaces.map((workspace) => (
            <div
              key={workspace.workspaceId}
              className="col-xl-3 col-lg-4 col-md-6 col-sm-12 col-xs-12 mb-4"
            >
              <div
                className="workspace-card card"
                onClick={() => handleWorkspaceClick(workspace.workspaceId)}
              >
                <div className="card-body">
                  <h2 className="card-title">{workspace.name}</h2>
                  <p className="card-text">Role: {workspace.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="workspace-actions text-center">
          <button
            type="button"
            className="btn btn-primary btn-large mb-4 btn-center"
            data-toggle="modal"
            data-target="#joinWorkspaceModal"
          >
            Join
          </button>
          <button
            type="button"
            className="btn btn-success btn-large mb-4 btn-center"
            data-toggle="modal"
            data-target="#createWorkspaceModal"
          >
            Create
          </button>
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
              <h5 className="modal-title" id="joinWorkspaceModalLabel">
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
                className="form-control mb-2"
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
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
              <h5 className="modal-title" id="createWorkspaceModalLabel">
                Create Workspace
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
                required
                type="text"
                placeholder="Workspace Name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="form-control mb-2"
              />
              <input
                type="text"
                placeholder="Domain Restrictions (comma separated)"
                value={newWorkspaceDomains}
                onChange={(e) => setNewWorkspaceDomains(e.target.value)}
                className="form-control mb-2"
              />
              <input
                type="text"
                placeholder="Max Group Size (optional)"
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(e.target.value)}
                className="form-control mb-2"
              />
              <input
                type="text"
                placeholder="Number of Groups (optional)"
                value={numGroups}
                onChange={(e) => setNumGroups(e.target.value)}
                className="form-control mb-2"
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-success"
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
