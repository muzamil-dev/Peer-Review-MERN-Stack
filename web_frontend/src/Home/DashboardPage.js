import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardPage.css";
import Api from "../Api.js";
import { enqueueSnackbar } from "notistack";
import { FaPlus } from "react-icons/fa6";
import { MdLogout } from "react-icons/md";
import { MdMenu } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import { OverlayTrigger, Tooltip, Modal, Button } from "react-bootstrap";
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
              <div className="flex justify-between">
                <h2 className="card-title text-4xl hover:underline w-fit text-center">
                  {workspace.name}
                </h2>
                <OverlayTrigger placement="bottom" overlay={deleteTooltip}>
                  {workspace.role === "Instructor" ? (
                    <button
                      className="hidden sm:block bg-red-500 rounded-2xl border-2 border-slate-100 p-2 hover:border hover:border-red-500 hover:shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkspaceClick(workspace.workspaceId);
                      }}
                    >
                      <BsTrash className="text-white size-7" />
                    </button>
                  ) : (
                    <span></span>
                  )}
                </OverlayTrigger>
              </div>

              <p className="card-text text-2xl text-start">
                Role: {workspace.role}
              </p>
              <div className="flex justify-center">
                {workspace.role === "Instructor" && (
                  <button
                    className="sm:hidden flex gap-2 w-6/12 text-white text-xl justify-center items-center bg-red-500 rounded-2xl border-2 border-slate-100 p-2 hover:border hover:border-red-500 hover:shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkspaceClick(workspace.workspaceId);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
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
  const deleteTooltip = <Tooltip id="delete-tooltip">Delete</Tooltip>;

  return (
    <div className="flex flex-col h-full">
      <nav className="flex w-full items-center flex-col bg-slate-100 p-3 justify-between navigation navbar-expand-lg">
        <div className="flex items-center w-full justify-between">
          <a
            className="text-black no-underline text-4xl hover:-translate-y-1"
            href="/"
          >
            <Logo className="dash-logo navbar-brand"></Logo>
          </a>
          <div className="dash-menu">
            <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#dash-collapse"
              aria-controls="dash-collapse"
              aria-label="Toggle Navbar"
              aria-expanded="false"
            >
              <MdMenu size={35} />
            </button>
          </div>
          <div className="flex gap-6 dash-buttons">
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
        </div>

        <div
          className="sm:none collapse navbar-collapse w-full justify-center"
          id="dash-collapse"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <button
                type="button"
                data-toggle="modal"
                data-target="#createWorkspaceModal"
                className="flex text-xl text-center items-center gap-2 border-2 border-slate-100 p-2  text-white rounded-xl bg-green-500 hover:border-green-500 hover:shadow-sm w-full"
              >
                <FaPlus className="size-7=true" />
                Add Workspace
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                onClick={handleLogout}
                className="flex text-xl border-2 items-center gap-2 border-slate-100 p-2  text-white rounded-xl bg-red-500 hover:border-red-500 hover:shadow-sm w-full"
              >
                <MdLogout className="size-7=true" />
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="">
        <div className="workspace-cards flex flex-col gap-3">
          <div className="workspaces-name mt-3 mb-2 md:ml-6 text-4xl sm:text-5xl lg:text-6xl text-white flex justify-center">
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
                <span>&times;</span>
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

        {/* Confirmation Modal for Deleting Workspace */}
        <div
          className={`modal fade ${
            showDeleteConfirmModal ? "show d-block" : ""
          }`}
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <Modal
            show={showDeleteConfirmModal}
            onHide={() => setShowDeleteConfirmModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <h3 className="text-3xl">Delete Workspace</h3>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5 className="text-center">
                {" "}
                Are you sure you want to delete this workspace?
              </h5>
              <h6 className="text-center font-bold">
                This action cannot be undone
              </h6>
            </Modal.Body>
            <div className="flex justify-center mb-3">
              <Button
                variant="danger"
                onClick={confirmDeleteWorkspace}
                className=""
              >
                Delete
              </Button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
