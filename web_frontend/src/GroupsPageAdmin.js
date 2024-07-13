import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupsPageAdmin.module.css'; // Import the CSS file as a module
import Api from './Api.js';  // Adjust the path to where your Api.js file is located

const GroupsPageAdmin = () => {
    const [ungroupedMembers, setUngroupedMembers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [workspaceDetails, setWorkspaceDetails] = useState({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        allowedDomains: '',
        groupMemberLimit: '',
        groupLock: false
    });
    const [editGroupId, setEditGroupId] = useState(null);
    const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
    const [selectedMemberGroup, setSelectedMemberGroup] = useState({});
    const [inviteCode, setInviteCode] = useState('');
    const { workspaceId } = useParams(); // Assuming you're using React Router v6
    const navigate = useNavigate();

    const fetchWorkspaceDetails = async () => {
        const response = await Api.Workspace.GetWorkspaceDetails(workspaceId);
        if (response.status === 200) {
            setWorkspaceDetails(response.data);
            setInviteCode(response.data.inviteCode); // Update inviteCode state
            setFormData({
                name: response.data.name,
                allowedDomains: response.data.allowedDomains.join(', '),
                groupMemberLimit: response.data.groupMemberLimit,
                groupLock: response.data.groupLock
            });
        } else {
            console.error('Failed to fetch workspace details:', response.message);
        }
    };

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

    useEffect(() => {
        fetchUngroupedMembers();
        fetchGroups();
        fetchWorkspaceDetails();
    }, [workspaceId]);

    const handleEditGroup = (groupId) => {
        navigate(`/groups/${groupId}/edit`);
    };

    const handleOpenEditForm = (groupId, members) => {
        setEditGroupId(groupId);
        setSelectedGroupMembers(members);
        const initialGroupAssignments = {};
        members.forEach(member => {
            initialGroupAssignments[member.userId] = groupId;
        });
        setSelectedMemberGroup(initialGroupAssignments);
    };

    const handleMemberGroupChange = (userId, newGroupId) => {
        setSelectedMemberGroup(prevState => ({
            ...prevState,
            [userId]: newGroupId
        }));
    };

    const handleKickFromGroup = async (targetId) => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Groups.RemoveUser(userId, targetId, editGroupId);
        if (response.success) {
            setSelectedGroupMembers(prevMembers => prevMembers.filter(member => member.userId !== targetId));
            // Update the group members in the groups state
            setGroups(prevGroups => prevGroups.map(group => {
                if (group.groupId === editGroupId) {
                    return { ...group, members: group.members.filter(member => member.userId !== targetId) };
                }
                return group;
            }));
            // Update ungroupedMembers state
            setUngroupedMembers(prevMembers => [...prevMembers, selectedGroupMembers.find(member => member.userId === targetId)]);
            // Also update selectedMemberGroup to reflect the kicked member
            setSelectedMemberGroup(prevState => {
                const newState = { ...prevState };
                delete newState[targetId];
                return newState;
            });
        } else {
            console.error('Failed to kick from group:', response.message);
        }
    };
    

    const handleKickFromWorkspace = async (targetId) => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Workspace.LeaveWorkspace(targetId, workspaceId);
        if (response.success) {
            setSelectedGroupMembers(prevMembers => prevMembers.filter(member => member.userId !== targetId));
        } else {
            console.error('Failed to kick from workspace:', response.message);
        }
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const allowedDomainsArray = formData.allowedDomains.trim() ? formData.allowedDomains.split(',').map(domain => domain.trim()) : [];
        const response = await Api.Workspace.EditWorkspace(userId, workspaceId, formData.name, allowedDomainsArray, formData.groupMemberLimit, formData.groupLock);
        if (response.success) {
            setWorkspaceDetails({
                name: formData.name,
                allowedDomains: allowedDomainsArray,
                groupMemberLimit: formData.groupMemberLimit,
                groupLock: formData.groupLock,
                inviteCode: workspaceDetails.inviteCode // Retain the current invite code
            });
            closeForm();
        } else {
            console.error('Failed to edit workspace:', response.message);
        }
    };

    const handleGroupChangesSubmit = async (event) => {
        event.preventDefault();
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
    
        const changes = Object.entries(selectedMemberGroup).map(([memberId, newGroupId]) => ({
            memberId,
            newGroupId
        }));
    
        for (const change of changes) {
            const { memberId, newGroupId } = change;
    
            // If the member is not in the editGroupId anymore, skip the remove step
            const memberInCurrentGroup = selectedGroupMembers.some(member => member.userId === memberId);
    
            if (memberInCurrentGroup) {
                // Remove the user from the current group
                const removeResponse = await Api.Groups.RemoveUser(userId, memberId, editGroupId);
                if (!removeResponse.success) {
                    console.error(`Failed to remove user ${memberId} from group ${editGroupId}:`, removeResponse.message);
                    continue;
                }
    
                // Update ungroupedMembers state if the member is not moved to a new group
                if (!newGroupId) {
                    setUngroupedMembers(prevMembers => [...prevMembers, selectedGroupMembers.find(member => member.userId === memberId)]);
                }
            }
    
            // Add the user to the new group
            const addResponse = await Api.Groups.AddUser(userId, memberId, newGroupId);
            if (!addResponse.success) {
                console.error(`Failed to add user ${memberId} to group ${newGroupId}:`, addResponse.message);
            } else {
                // Remove from ungroupedMembers state if the member is added to a group
                setUngroupedMembers(prevMembers => prevMembers.filter(member => member.userId !== memberId));
            }
        }
    
        setEditGroupId(null);
        fetchGroups(); // Refetch groups to update the UI
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleLockChange = (value) => {
        setFormData(prevState => ({
            ...prevState,
            groupLock: value
        }));
    };

    const handleCreateInviteCode = async () => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Workspace.SetInviteCode(userId, workspaceId);
        if (response.success) {
            setInviteCode(response.inviteCode); // Update inviteCode state
            setWorkspaceDetails(prevDetails => ({
                ...prevDetails,
                inviteCode: response.inviteCode
            }));
        } else {
            console.error('Failed to create invite code:', response.message);
        }
    };

    const handleDeleteInviteCode = async () => {
        const userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID
        const response = await Api.Workspace.RemoveActiveInvite(userId, workspaceId);
        if (response.success) {
            setInviteCode(null); // Update inviteCode state
            setWorkspaceDetails(prevDetails => ({
                ...prevDetails,
                inviteCode: null
            }));
        } else {
            console.error('Failed to delete invite code:', response.message);
        }
    };

    const openForm = () => {
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
    };

    return (
        <div className={styles.workspaceAdmin}>
            <div className={`row ${styles.headerContainer}`}>
                <button className="open-button col-xl-2 col-lg-2 btn btn-primary" onClick={openForm}>Edit Workspace</button>
                <h1 className={`col-xl-8 col-lg-6 ${styles.headerLarge}`}>Groups</h1>
                <button className="col-xl-2 col-lg-2 btn btn-success" onClick={handleCreateGroup}>Add Group</button>
            </div>

            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleSubmit} className={styles.formContainer}>
                            <h1></h1>

                            <label htmlFor="name"><b>Workspace Name</b></label>
                            <input type="text" placeholder="Enter Workspace Name" name="name" required value={formData.name} onChange={handleChange} />

                            <label htmlFor="allowedDomains"><b>Allowed Domains</b></label>
                            <input type="text" placeholder="Enter Allowed Domains" name="allowedDomains" value={formData.allowedDomains} onChange={handleChange} />

                            <label htmlFor="groupMemberLimit"><b>Maximum Group Size</b></label>
                            <input type="number" placeholder="Enter Group Member Limit" name="groupMemberLimit" required value={formData.groupMemberLimit} onChange={handleChange} />

                            {/* Invite Code Section */}
                            <div className="mb-3 text-center">
                                <label><b>Invite Code:</b></label>
                                <p>{inviteCode ? inviteCode : "No invite code available"}</p>
                                <div className="btn-group mb-3">
                                    <button type="button" className="btn btn-success" onClick={handleCreateInviteCode} style={{ width: '100px' }}>Create</button>
                                    <button type="button" className="btn btn-danger" onClick={handleDeleteInviteCode} style={{ width: '100px' }}>Delete</button>
                                </div>
                            </div>

                            {/*button group to lock or unlock the workspace */}
                            <div className="btn-group mb-3">
                                <button type="button" className={`btn ${formData.groupLock ? 'btn-outline-primary' : 'btn-primary'}`} onClick={() => handleLockChange(true)}>Lock</button>
                                <button type="button" className={`btn ${!formData.groupLock ? 'btn-outline-primary' : 'btn-primary'}`} onClick={() => handleLockChange(false)}>Unlock</button>
                            </div>

                            <button type="submit" className="btn btn-outline-success mb-3">Save</button>
                            <button type="button" className="btn cancel btn-outline-danger" onClick={closeForm}>Close</button>
                        </form>
                    </div>
                </div>
            )}

            {editGroupId && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleGroupChangesSubmit}>
                            {selectedGroupMembers.map(member => (
                                <div key={member.userId} className={styles.memberEditRow}>
                                    <div className="d-flex justify-content-between">
                                        <span className="mt-2">{member.firstName} {member.lastName}</span>
                                        <select
                                            value={selectedMemberGroup[member.userId]}
                                            onChange={(e) => handleMemberGroupChange(member.userId, e.target.value)}
                                            className={`${styles.dropdown} form-select`}>
                                            {groups.map(group => (
                                                <option key={group.groupId} value={group.groupId}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="btn-group mb-3 d-flex justify-content-center">
                                        <button type="button" className="btn btn-outline-dark mt-2" onClick={() => handleKickFromGroup(member.userId)}>Kick from Group</button>
                                        <button type="button" className="btn btn-outline-dark mt-2" onClick={() => handleKickFromWorkspace(member.userId)}>Kick from Workspace</button>
                                    </div>
                                </div>
                            ))}
                            <button type="submit" className="btn btn-primary mb-2">Submit Changes</button>
                            <button type="button" className="btn btn-danger" onClick={() => setEditGroupId(null)}>Close</button>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                {ungroupedMembers.length > 0 && (
                    <div className={`${styles.ungroupedCard} ${styles.groupCardWrapper} ${styles.ungrouped}`}>
                        <div className={`card ${styles.groupCard} ${styles.ungrouped}`}>
                            <div className="card-body d-flex flex-column ungrouped_body">
                                <h2 className="card-title ungrouped-title">Ungrouped Members</h2>
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
                                                onClick={() => handleOpenEditForm(group.groupId, group.members)}
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
