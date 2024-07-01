import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupsPageAdmin.module.css'; // Import the CSS file as a module
import Api from './Api.js'; // Adjust the path to where your Api.js file is located

const GroupsPageUser = () => {
    const [groups, setGroups] = useState([]);
    const { workspaceId } = useParams(); // Assuming you're using React Router v6
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            const response = await Api.Workspace.GetGroups(workspaceId);
            if (response.status === 200 && Array.isArray(response.data.groups)) {
                setGroups(response.data.groups);
            } else {
                console.error('Failed to fetch groups:', response.message);
                setGroups([]);
            }
        };

        fetchGroups();
    }, [workspaceId]);

    const handleJoinGroup = async (groupId) => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Groups.AddUser(userId, groupId);
        if (response.success) {
            // Update groups state to reflect the join
            setGroups(groups.map(group => {
                if (group.groupId === groupId) {
                    return {
                        ...group,
                        members: [...group.members, { userId: userId, firstName: 'Firstname', lastName: 'Lastname' }]
                    };
                }
                return group;
            }));
        } else {
            console.error('Failed to join group:', response.message);
        }
    };

    const handleLeaveGroup = async (groupId) => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Groups.RemoveUser(userId, groupId);
        if (response.success) {
            // Update groups state to reflect the leave
            setGroups(groups.map(group => {
                if (group.groupId === groupId) {
                    return {
                        ...group,
                        members: group.members.filter(member => member.userId !== userId)
                    };
                }
                return group;
            }));
        } else {
            console.error('Failed to leave group:', response.message);
        }
    };

    const handleDashboard = () => {
        navigate('/dashboard'); // Navigate to dashboard page
    };

    return (
        <div className={styles.workspaceUser}>
            <div className={`row ${styles.headerContainer}`}>
                <h1 className={`col-xl-8 col-lg-6 ${styles.headerLarge}`}>Groups</h1>
                <button className="col-xl-2 col-lg-2 btn btn-primary" onClick={handleDashboard}>Dashboard</button>
            </div>

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
                                        {!group.members.some(member => member.userId === '6671c8362ffea49f3018bf61') ? (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleJoinGroup(group.groupId)}
                                            >
                                                Join
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleLeaveGroup(group.groupId)}
                                            >
                                                Leave
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
