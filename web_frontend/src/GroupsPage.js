import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GroupsPage.css'; // Import the CSS file as a module
import Api from './Api.js';
import { jwtDecode } from 'jwt-decode';

const GroupsPageUser = () => {
    const [groups, setGroups] = useState([]);
    const [workspaceDetails, setWorkspaceDetails] = useState({ name: '', groupLock: false });
    const { workspaceId } = useParams(); // Assuming you're using React Router v6
    const navigate = useNavigate();
    const [joinedGroupId, setJoinedGroupId] = useState(null); // Track the joined group
    const [errorMessage, setErrorMessage] = useState(''); // State variable for error messages
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    const fetchWorkspaceDetails = async () => {
        const response = await Api.Workspaces.GetWorkspaceDetails(workspaceId);
        if (response.status === 200) {
            setWorkspaceDetails(response.data);
        } else {
            console.error('Failed to fetch workspace details:', response.message);
        }
    };

    const fetchGroups = async () => {
        const response = await Api.Workspaces.GetGroups(workspaceId);
        if (response.status === 200 && Array.isArray(response.data.groups)) {
            setGroups(response.data.groups.map(group => ({
                ...group,
                members: group.members.filter(member => member && member.userId)
            })));

            // Check if user is already in a group
            const currentUserId = getCurrentUserId();
            const userInGroup = response.data.groups.find(group => {
                return group.members.some(member => member.userId === currentUserId);
            });
            if (userInGroup) {
                setJoinedGroupId(userInGroup.groupId); // Set joinedGroup if user is already in a group
            } else {
                setJoinedGroupId(null);
            }
        } else {
            console.error('Failed to fetch groups:', response.message);
            setGroups([]); // Ensure groups is an array even on error
        }
    };

    useEffect(() => {
        fetchWorkspaceDetails();
        fetchGroups();
    }, [workspaceId]);

    const handleJoinGroup = async (groupId) => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || joinedGroupId !== null || workspaceDetails.groupLock) {
            return; // Prevent joining another group if already in one, if user is not authenticated, or if the workspace is locked
        }
        const response = await Api.Groups.JoinGroup(groupId, currentUserId);
        if (response.success) {
            fetchGroups(); // Refetch groups to update the UI
            setJoinedGroupId(groupId); // Update joinedGroup state
        } else {
            console.error('Failed to join group:', response.message);
            setErrorMessage('Failed to join group. Capacity reached.');
        }
    };

    const handleLeaveGroup = async (groupId) => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || workspaceDetails.groupLock) {
            navigate('/login');
            return { success: false };
        }
        const response = await Api.Groups.LeaveGroup(groupId, currentUserId);
        if (response.success) {
            fetchGroups(); // Refetch groups to update the UI
            setJoinedGroupId(null); // Clear joinedGroup state
        } else {
            console.error('Failed to leave group:', response.message);
            setErrorMessage(response.message);
        }
    };

    const handleLeaveWorkspace = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || workspaceDetails.groupLock) {
            navigate('/login');
            return { success: false };
        }
        const response = await Api.Workspaces.LeaveWorkspace(currentUserId, workspaceId);
        if (response.success) {
            fetchGroups();
            handleDashboard();
        } else {
            console.error('Failed to leave workspace:', response.message);
            setErrorMessage(response.message);
        }
    };

    const handleDashboard = () => {
        navigate('/DashboardPage'); // Navigate to dashboard page
    };

    const assignmentsPage = () => {
        navigate('/userDashboard'); // Navigate to assignments page
    };

    return (
        <div className="workspaceUser">
            <div className="row headerContainer d-flex justify-content-center align-items-center">
                <div className="col-xl-3 col-lg-3 col-md-3 col-auto text-center">
                    <button className="btn btn-light mb-2" onClick={assignmentsPage}>Assignments</button>
                </div>
                <h1 className="col-xl-6 col-lg-6 col-md-6 col-auto headerLarge text-center">{workspaceDetails.name}</h1>
                <div className="col-xl-3 col-lg-3 col-md-3 col-sm-3 col-auto text-center">
                    <button className="btn btn-light mb-2" onClick={handleDashboard}>Dashboard</button>
                </div>
                <div className="w-100 d-flex justify-content-center">
                    <button className="btn btn-danger mb-2" onClick={() => setShowConfirmModal(true)} disabled={workspaceDetails.groupLock}>Leave Workspace</button>
                </div>
            </div>

            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            <div className="container">
                <div className="row">
                    {Array.isArray(groups) && groups.map((group) => (
                        <div key={group.groupId} className="col-12 col-sm-6 col-lg-4  mb-4">
                            <div className="card groupCard">
                                <div className="card-body d-flex flex-column">
                                    <h2 className="card-title">{group.name}</h2>
                                    <ul className="list-unstyled flex-grow-1">
                                        {Array.isArray(group.members) && group.members.map(member => (
                                            <li key={member.userId}>{member.firstName} {member.lastName}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-auto">
                                        {joinedGroupId === group.groupId ? (
                                            <>
                                                <button
                                                    className="btn btn-success"
                                                    disabled
                                                >
                                                    Joined
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleLeaveGroup(group.groupId)}
                                                    disabled={workspaceDetails.groupLock}
                                                >
                                                    Leave
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleJoinGroup(group.groupId)}
                                                disabled={joinedGroupId !== null || workspaceDetails.groupLock}
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation form */}
            <div className={`modal fade ${showConfirmModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Leave</h5>
                            <button type="button" className="close" onClick={() => setShowConfirmModal(false)} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to leave this workspace?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={() => { setShowConfirmModal(false); handleLeaveWorkspace(); }}>Leave</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GroupsPageUser;
