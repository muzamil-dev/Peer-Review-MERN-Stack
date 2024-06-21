import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupsPageAdmin.module.css'; // Import the CSS file as a module
import Api from './Api.js';  // Adjust the path to where your Api.js file is located
import { jwtDecode } from 'jwt-decode';
//snackbar
import { enqueueSnackbar } from 'notistack';

const GroupsPageAdmin = () => {
    const [ungroupedMembers, setUngroupedMembers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [workspaceDetails, setWorkspaceDetails] = useState({});
    const [workspaceName, setWorkspaceName] = useState('');
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

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [showKickConfirmModal, setShowKickConfirmModal] = useState(false);
    const [memberToKick, setMemberToKick] = useState(null);
    const [kickFrom, setKickFrom] = useState(null);

    const { workspaceId } = useParams(); 
    const navigate = useNavigate();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    const fetchWorkspaceDetails = async () => {
        const token = localStorage.getItem('accessToken');
        const response = await Api.Workspaces.GetWorkspaceDetails(workspaceId, token);
        if (response.status === 200) {
            const allowedDomains = response.data.allowedDomains || [];
            setWorkspaceDetails(response.data);
            setWorkspaceName(response.data.name);
            setInviteCode(response.data.inviteCode);
            setFormData({
                name: response.data.name,
                allowedDomains: allowedDomains.join(', '),
                groupMemberLimit: response.data.groupMemberLimit,
                groupLock: response.data.groupLock
            });
        } else {
            console.error('Failed to fetch workspace details:', response.message);
        }
    };

    const fetchGroups = async () => {
        const token = localStorage.getItem('accessToken');
        const response = await Api.Workspaces.GetGroups(workspaceId, token);
        if (response.status === 200 && Array.isArray(response.data.groups)) {
            setGroups(response.data.groups.map(group => ({
                ...group,
                members: group.members.filter(member => member && member.userId)
            })));
        } else {
            console.error('Failed to fetch groups:', response.message);
            setGroups([]);
        }
    };

    const fetchUngroupedMembers = async () => {
        const token = localStorage.getItem('accessToken');
        const response = await Api.Workspaces.GetStudentsWithoutGroup(workspaceId, token);
        if (response.status === 200 && Array.isArray(response.data)) {
            const sortedMembers = response.data
                .filter(member => member && member.userId)
                .sort((a, b) => a.lastName.localeCompare(b.lastName));
            setUngroupedMembers(sortedMembers);
        } else {
            console.error('Failed to fetch ungrouped members:', response.message);
            setUngroupedMembers([]);
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

    const goToUserAnalytics = (userId) => {
        navigate(`/workspace/${workspaceId}/user/${userId}/analytics`);
    };

    const handleAddUserToGroup = async (targetId, groupId) => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return { success: false };
        }
        const response = await Api.Groups.AddUser(currentUserId, targetId, groupId);
        if (response.success) {
            setGroups(prevGroups => prevGroups.map(group => {
                if (group.groupId === groupId) {
                    return { ...group, members: [...group.members, ungroupedMembers.find(member => member.userId === targetId)] };
                }
                return group;
            }));
            fetchUngroupedMembers();
            fetchGroups();
            return { success: true };
        } else {
            console.error('Failed to add user to group:', response.message);
            return { success: false };
        }
    };

    const handleKickFromGroup = async (targetId) => {
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return { success: false };
        }
        const response = await Api.Groups.RemoveUser(currentUserId, targetId, editGroupId, token);
        if (response.success) {
            setSelectedGroupMembers(prevMembers => prevMembers.filter(member => member.userId !== targetId));
            setGroups(prevGroups => prevGroups.map(group => {
                if (group.groupId === editGroupId) {
                    return { ...group, members: group.members.filter(member => member.userId !== targetId) };
                }
                return group;
            }));
            fetchUngroupedMembers();
            setUngroupedMembers(prevMembers => [...prevMembers, selectedGroupMembers.find(member => member.userId === targetId)]);
            setSelectedMemberGroup(prevState => {
                const newState = { ...prevState };
                delete newState[targetId];
                return newState;
            });
            fetchGroups(); // Refetch groups to update the UI
            return { success: true };
        } else {
            console.error('Failed to kick from group:', response.message);
            return { success: false };
        }
    };

    const handleKickFromWorkspace = async (targetId) => {
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }
        const response = await Api.Workspaces.RemoveUser(currentUserId, targetId, workspaceId, token);
        if (response.success) {
            setUngroupedMembers(prevMembers => prevMembers.filter(member => member.userId !== targetId));
            fetchUngroupedMembers();
            fetchGroups(); // Refetch groups to update the UI
        } else {
            console.error('Failed to kick from workspace:', response.message);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        setShowDeleteConfirmModal(true);
        setGroupToDelete(groupId);
    };

    const confirmDeleteGroup = async () => {
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }
        const response = await Api.Groups.DeleteGroup(currentUserId, groupToDelete, token);
        fetchUngroupedMembers();
        if (response.success) {
            setGroups(groups.filter(group => group.groupId !== groupToDelete));
        } else {
            console.error('Failed to delete group:', response.message);
        }

        setShowDeleteConfirmModal(false);
        setGroupToDelete(null);
        fetchGroups(); // Refetch groups to update the UI
    };

    const handleKickConfirmation = (targetId, from) => {
        setShowKickConfirmModal(true);
        setMemberToKick(targetId);
        setKickFrom(from);
    };

    const confirmKickMember = async () => {
        if (kickFrom === 'group') {
            await handleKickFromGroup(memberToKick);
        } else if (kickFrom === 'workspace') {
            await handleKickFromWorkspace(memberToKick);
        }
        setShowKickConfirmModal(false);
        setMemberToKick(null);
        setKickFrom(null);
        fetchUngroupedMembers(); // Refetch ungrouped members to update the UI
        fetchGroups(); // Refetch groups to update the UI
    };

    const handleCreateGroup = async () => {
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }
        try {
            const response = await Api.Groups.CreateGroup(currentUserId, workspaceId, token);
            if (response.status === 201) {
                setGroups([...groups, response.data]);
                fetchGroups(); // Refetch groups to update the UI
            } else {
                console.error('Failed to create group:', response.message);
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }

        const maxWorkspaceNameLength = 25;
        if (formData.name.length > maxWorkspaceNameLength) {
            enqueueSnackbar(`Workspace name exceeds the maximum length of ${maxWorkspaceNameLength} characters.`, { variant: 'error' });
            return;
        }

        const allowedDomainsArray = formData.allowedDomains.trim()
            ? formData.allowedDomains.split(',').map(domain => domain.trim())
            : [];

        const isValidDomain = (domain) => {
            const domainRegex = /^[a-zA-Z]+\.[a-zA-Z]+$/;
            return domainRegex.test(domain);
        };

        for (const domain of allowedDomainsArray) {
            if (!isValidDomain(domain)) {
                console.error(`Invalid domain: ${domain}`);
                alert(`Invalid domain: ${domain}`);
                return;
            }
        }

        const response = await Api.Workspaces.EditWorkspace(currentUserId, workspaceId, formData.name, allowedDomainsArray, formData.groupMemberLimit, formData.groupLock, token);
        if (response.success) {
            setWorkspaceDetails({
                name: formData.name,
                allowedDomains: allowedDomainsArray,
                groupMemberLimit: formData.groupMemberLimit,
                groupLock: formData.groupLock,
                inviteCode: workspaceDetails.inviteCode
            });
            //snakcbar for success
            enqueueSnackbar('Workspace details updated successfully', { variant: 'success' });
            fetchWorkspaceDetails();
            closeForm();
        } else {
            console.error('Failed to edit workspace:', response.message);
        }
    };

    const handleGroupChangesSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }

        const changes = Object.entries(selectedMemberGroup).map(([memberId, newGroupId]) => ({
            memberId,
            newGroupId
        }));

        for (const change of changes) {
            const { memberId, newGroupId } = change;
            const memberInCurrentGroup = selectedGroupMembers.some(member => member.userId === memberId);
            if (editGroupId !== newGroupId) {
                const removeResponse = await handleKickFromGroup(memberId);
                if (!removeResponse.success) {
                    console.error(`Failed to remove user ${memberId} from group ${editGroupId}`);
                }
            }
            if (newGroupId) {
                const addResponse = await handleAddUserToGroup(memberId, newGroupId);
                if (!addResponse.success) {
                    console.error(`Failed to add user ${memberId} to group ${newGroupId}`);
                }
            }
        }

        setEditGroupId(null);
        fetchGroups();
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
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }
        const response = await Api.Workspaces.SetInviteCode(currentUserId, workspaceId, token);
        if (response.status === 200) {
            setInviteCode(response.inviteCode);
            setWorkspaceDetails(prevDetails => ({
                ...prevDetails,
                inviteCode: response.inviteCode
            }));
        } else {
            console.error('Failed to create invite code:', response.message);
        }
    };

    const handleDeleteInviteCode = async () => {
        const token = localStorage.getItem('accessToken');
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            navigate('/');
            return;
        }
        const response = await Api.Workspaces.RemoveActiveInvite(currentUserId, workspaceId, token);
        if (response.success) {
            setInviteCode(null);
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

    const createForm = () => {
        navigate(`/formsAdmin/${workspaceId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/');
    };

    return (
        <div className={styles.workspaceAdmin}>
            
            <nav className={styles.navbarContainer}>
                <a className={styles.navbarBrand} href="/DashboardPage">Rate My Peer</a>
                <button className={styles.navbarToggler} type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={styles.navbarCollapse} id="navbarNav">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item">
                        </li>
                        <li className="nav-item">
                            <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className={`row ${styles.headerContainer}`}>
                <button className={`open-button ol-xl-3 col-lg-3 col-md-3 col-sm-3 btn btn-light mb-2 mb-md-0 ${styles.fixedWidthSm} ${styles.custom}`} onClick={createForm}>Create Forms</button>
                <h1 className={`col-xl-6 col-lg-6 col-md-6 col-sm-6 ${styles.headerLarge} text-center`}>{workspaceName}</h1>
                <button className={`open-button col-xl-3 col-lg-3 col-md-3 col-sm-3 btn btn-light mb-2 mb-md-0 ${styles.fixedWidthSm}`} onClick={openForm}>Edit Workspace</button>
                <button className={`col-xl-2 col-lg-2 col-md-3 btn btn-success col-sm-4 mb-2 mb-md-0 ${styles.fixedWidthSm}`} onClick={handleCreateGroup}>Add Group</button>
            </div>

            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleSubmit} className={styles.formContainer}>
                            <h1></h1>

                            <label htmlFor="name"><b>Workspace Name</b></label>
                            <input type="text" placeholder="Enter Workspace Name" name="name" required value={formData.name} onChange={handleChange} />

                            <label htmlFor="allowedDomains"><b>Allowed Domains</b></label>
                            <input type="text" placeholder="Ex: ucf.edu, gmail.com" name="allowedDomains" value={formData.allowedDomains} onChange={handleChange} />

                            <label htmlFor="groupMemberLimit"><b>Maximum Group Size</b></label>
                            <input type="number" placeholder="Enter Group Member Limit" name="groupMemberLimit" value={formData.groupMemberLimit} onChange={handleChange} />

                            {/* Invite Code Section */}
                            <div className="mb-2 text-center">
                                <label><b>Invite Code:</b></label>
                                <p>{inviteCode ? inviteCode : "No invite code available"}</p>
                                <div className="btn-group mb-3">
                                    <button type="button" className="btn btn-success" onClick={handleCreateInviteCode} style={{ width: '100px' }}>Create</button>
                                    <button type="button" className="btn btn-danger mb-0" onClick={handleDeleteInviteCode} style={{ width: '100px' }}>Delete</button>
                                </div>
                            </div>

                            {/*button group to lock or unlock the workspace */}
                            <div className="btn-group mb-3">
                                <button type="button" className={`btn ${formData.groupLock ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleLockChange(true)}>Lock</button>
                                <button type="button" className={`btn ${!formData.groupLock ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleLockChange(false)}>Unlock</button>
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
                                member && (
                                    <div key={member.userId} className={styles.memberEditRow}>
                                        <div className="d-flex justify-content-between">
                                            <span className="mt-2" onClick={() => goToUserAnalytics(member.userId)} style={{ cursor: 'pointer' }}>{member.firstName} {member.lastName}</span>
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
                                            <button type="button" className="btn btn-outline-dark mt-2" onClick={() => handleKickConfirmation(member.userId, 'group')}>Kick from Group</button>
                                            <button type="button" className="btn btn-outline-dark mt-2" onClick={() => handleKickConfirmation(member.userId, 'workspace')}>Kick from Workspace</button>
                                        </div>
                                    </div>
                                )
                            ))}
                            {/* <button type="submit" className="btn btn-primary mb-2">Submit Changes</button> */}
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
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ungroupedMembers.map(member => (
                                                member && (
                                                    <tr key={member.userId}>
                                                        <td onClick={() => goToUserAnalytics(member.userId)} style={{ cursor: 'pointer' }}>{member.firstName}</td>
                                                        <td onClick={() => goToUserAnalytics(member.userId)} style={{ cursor: 'pointer' }}>{member.lastName}</td>
                                                        <td>{member.email}</td>
                                                        <td className={styles.temp}>
                                                            <select
                                                                value={selectedMemberGroup[member.userId] || ''}
                                                                onChange={(e) => handleAddUserToGroup(member.userId, e.target.value)}
                                                                className={`${styles.dropdown} form-select`}
                                                            >
                                                                <option value="">Assign to group</option>
                                                                {groups.map(group => (
                                                                    <option key={group.groupId} value={group.groupId}>
                                                                        {group.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                className="btn btn-danger ml-2 mt-0"
                                                                onClick={() => handleKickConfirmation(member.userId, 'workspace')}
                                                            >
                                                                Kick
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
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
                            <div key={group.groupId} className="col-12 col-sm-6 col-lg-4  mb-4">
                                <div className={`card ${styles.groupCard}`}>
                                    <div className="card-body d-flex flex-column">
                                        <h2 className="card-title">{group.name}</h2>
                                        <ul className="list-unstyled flex-grow-1">
                                            {Array.isArray(group.members) && group.members.map(member => (
                                                member && (
                                                    <li 
                                                    key={member.userId} onClick={() => goToUserAnalytics(member.userId)} style={{ cursor: 'pointer' }}className={`${styles.hoverEffect}`}> {member.firstName} {member.lastName}
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                        <div className="mt-auto">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleOpenEditForm(group.groupId, group.members)}
                                                //disable the edit button if there are no members in the group
                                                // disabled={group.members.length === 0}
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

            {/* Confirmation Modal for Deleting Group */}
            <div className={`modal fade ${showDeleteConfirmModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Delete</h5>
                            <button type="button" className="close" onClick={() => setShowDeleteConfirmModal(false)} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this group?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirmModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={confirmDeleteGroup}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal for Kicking Member */}
            <div className={`modal fade ${showKickConfirmModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Kick</h5>
                            <button type="button" className="close" onClick={() => setShowKickConfirmModal(false)} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to kick this member {kickFrom === 'group' ? 'from the group' : 'from the workspace'}?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowKickConfirmModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={confirmKickMember}>Kick</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GroupsPageAdmin;
