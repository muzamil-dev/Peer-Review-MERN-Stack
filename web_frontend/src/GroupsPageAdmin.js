import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupsPageAdmin.module.css'; // Import the CSS file as a module
import Api from './Api.js';  // Adjust the path to where your Api.js file is located

const GroupsPageAdmin = () => {
    const [ungroupedMembers, setUngroupedMembers] = useState([]);
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
                setGroups([]); // Ensure groups is an array even on error
            }
        };

        const fetchUngroupedMembers = async () => {
            const response = await Api.Workspace.GetStudentsWithoutGroup(workspaceId);
            if (response.status === 200 && Array.isArray(response.data)) {
                setUngroupedMembers(response.data);
            } else {
                console.error('Failed to fetch ungrouped members:', response.message);
                setUngroupedMembers([]); // Ensure ungroupedMembers is an array even on error
            }
        };

        fetchUngroupedMembers();
        fetchGroups();
    }, [workspaceId]);

    const handleEditGroup = (groupId) => {
        navigate(`/groups/${groupId}/edit`);
    };

    const handleDeleteGroup = async (groupId) => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Groups.DeleteGroup(userId, groupId);
        if (response.success) {
            setGroups(groups.filter(group => group.groupId !== groupId));
        } else {
            console.error('Failed to delete group:', response.message);
        }
    };

    const handleCreateGroup = async () => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        try {
            const response = await Api.Groups.CreateGroup(userId, workspaceId);
            if (response.status === 201) {
                setGroups([...groups, response.data]);
            } else {
                console.error('Failed to create group:', response.message);
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    return (
        <div className={styles.workspaceAdmin}>
            <h1 className={styles.headerLarge}>Groups</h1>
            <button className="btn btn-success mb-4" onClick={handleCreateGroup}>Create Group</button>
            <div className={styles.container}>
                {ungroupedMembers.length > 0 && (
                    <div className={`${styles.ungroupedCard} ${styles.groupCardWrapper}`}>
                        <div className={`card ${styles.groupCard} ${styles.ungrouped}`}>
                            <div className="card-body d-flex flex-column">
                                <h2 className="card-title">Ungrouped Members</h2>
                                <div className={styles.tableContainer}>
                                    <table className={`table ${styles.membersTable}`}>
                                        <thead>
                                            <tr>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ungroupedMembers.map(member => (
                                                <tr key={member.userId}>
                                                    <td>{member.firstName}</td>
                                                    <td>{member.lastName}</td>
                                                    <td>{member.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
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
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => handleEditGroup(group.groupId)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn btn-danger ml-2"
                                                onClick={() => handleDeleteGroup(group.groupId)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupsPageAdmin;
