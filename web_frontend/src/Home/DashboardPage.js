import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardPage.css";
import Api from "../Api.js";
import { enqueueSnackbar } from "notistack";
import { FaPlus } from "react-icons/fa6";
import { MdLogout } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { ReactComponent as Logo } from "../assets/logo.svg";

const DashboardPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

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

  const handleAddWorkspace = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    const maxWorkspaceNameLength = 25;

    if (newWorkspaceName.length > maxWorkspaceNameLength) {
      enqueueSnackbar(
        `Workspace name exceeds the maximum length of ${maxWorkspaceNameLength} characters.`,
        { variant: "error" }
      );
      return;
    }

    try {
      if (newWorkspaceName === "") {
        enqueueSnackbar("Workspace name cannot be empty.", {
          variant: "error",
        });
        return;
      }
      const response = await Api.Workspaces.CreateWorkspace(
        newWorkspaceName,
        userId
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
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName("");
        enqueueSnackbar("Workspace created successfully.", {
          variant: "success",
        });
      } else {
        enqueueSnackbar("Failed to create workspace.", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error creating workspace.", { variant: "error" });
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    const workspace = workspaces.find((w) => w.workspaceId === workspaceId);
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

  const handleDeleteWorkspaceClick = (workspaceId) => {
    setWorkspaceToDelete(workspaceId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (workspaceToDelete) {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/");
        return;
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      try {
        const response = await Api.Workspaces.deleteWorkspace(
          workspaceToDelete,
          userId
        );
        if (response.status === 200) {
          setWorkspaces(
            workspaces.filter(
              (workspace) => workspace.workspaceId !== workspaceToDelete
            )
          );
          enqueueSnackbar("Workspace deleted successfully.", {
            variant: "success",
          });
        } else {
          enqueueSnackbar("Failed to delete workspace.", { variant: "error" });
        }
      } catch (error) {
        enqueueSnackbar("Only Admins can delete workspaces.", {
          variant: "error",
        });
      } finally {
        setShowDeleteConfirmModal(false);
        setWorkspaceToDelete(null);
      }
    }
  };

  const WorkspaceDisplay = () => {
    if (workspaces.length)
      return workspaces.map((workspace) => (
        <div
          key={workspace.workspaceId}
          className="flex sm:justify-center relative"
        >
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
              {workspace.role === "Instructor" && (
                <button
                  className="absolute top-0 right-0 mt-2 mr-2 text-red-600 hover:text-red-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWorkspaceClick(workspace.workspaceId);
                  }}
                >
                  <BsTrash size={24} />
                </button>
              )}
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
            Add a Workspace to Display Available Workspaces
          </h4>
        </div>
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const addTooltip = <Tooltip id="add-tooltip">Add Workspace</Tooltip>;
  const logOutTooltip = <Tooltip id="leave-tooltip">Sign out</Tooltip>;

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
              <FaPlus className="text-slate-100 size-8" />
            </button>
          </OverlayTrigger>
          <OverlayTrigger placement="bottom" overlay={logOutTooltip}>
            <button
              type="button"
              onClick={handleLogout}
              className="flex border-2 border-slate-100 p-2  rounded-xl bg-red-500 hover:border-red-500 hover:shadow-sm"
            >
              <MdLogout className="text-slate-100 size-8" />
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
            <div className="modal-body">
              <input
                required
                type="text"
                placeholder="Workspace Name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="form-control mb-2 border-black focus:border-none"
              />
            </div>
            <div className="flex justify-center mb-2">
              <button
                id="create-btn"
                data-dismiss="modal"
                type="button"
                className="bg-green-600 rounded-lg p-2  hover:bg-green-500 text-white"
                onClick={handleAddWorkspace}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Workspace */}
      <div
        className={`modal fade ${showDeleteConfirmModal ? "show d-block" : ""}`}
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button
                type="button"
                className="close"
                onClick={() => setShowDeleteConfirmModal(false)}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete this workspace? This action
                cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDeleteWorkspace}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
