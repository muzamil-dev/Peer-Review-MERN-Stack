import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupsPageAdmin.module.css'; // Import the CSS file as a module
import Api from './Api.js'; 
import { jwtDecode } from 'jwt-decode';

const GroupsPageUser = () => {
    const [groups, setGroups] = useState([]);
    const { workspaceId } = useParams(); // Assuming you're using React Router v6
    const navigate = useNavigate();
    const [joinedGroupId, setJoinedGroupId] = useState(null); // Track the joined group
    const [errorMessage, setErrorMessage] = useState(''); // State variable for error messages


    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    const fetchGroups = async () => {
        const response = await Api.Workspace.GetGroups(workspaceId);
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
        fetchGroups();
    }, [workspaceId]);

    const handleJoinGroup = async (groupId) => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || joinedGroupId !== null) {
            return; // Prevent joining another group if already in one or if user is not authenticated
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
        if (!currentUserId) {
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

    const handleDashboard = () => {
        navigate('/DashboardPage'); // Navigate to dashboard page
    };

    return (
        <div className={styles.workspaceUser}>
            <div className={`row ${styles.headerContainer}`}>
                <div className="col-xl-2 col-lg-2"></div>
                <h1 className={`col-xl-8 col-lg-6 ${styles.headerLarge}`}>Groups</h1>
                <button className="col-xl-2 col-lg-2 btn btn-primary" onClick={handleDashboard}>Dashboard</button>
            </div>

            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            <div className="container">
                <div className="row">
                    {Array.isArray(groups) && groups.map((group) => (
                        <div key={group.groupId} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                            <div className={`card ${styles.groupCard}`}>
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
                                                >
                                                    Leave
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleJoinGroup(group.groupId)}
                                                disabled={joinedGroupId !== null}
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
        </div>
    );
};

export default GroupsPageUser;
