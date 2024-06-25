import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
    const [workspaces, setWorkspaces] = useState([
        { id: 1, name: 'Workspace 1', role: 'Admin' },
        { id: 2, name: 'Workspace 2', role: 'User' },
        { id: 3, name: 'Workspace 3', role: 'User' },
        { id: 4, name: 'Workspace 4', role: 'User' },
        { id: 5, name: 'Workspace 5', role: 'User' },
        { id: 6, name: 'Workspace 6', role: 'User' },
        // { id: 7, name: 'Workspace 7', role: 'User' },
        // { id: 8, name: 'Workspace 8', role: 'Admin' },
        // { id: 9, name: 'Workspace 9', role: 'User' },
        // { id: 10, name: 'Workspace 10', role: 'User' },
        // { id: 11, name: 'Workspace 11', role: 'User' },
        // { id: 12, name: 'Workspace 12', role: 'User' },
        // { id: 13, name: 'Workspace 13', role: 'User' },
        // { id: 14, name: 'Workspace 14', role: 'Admin' },
        // { id: 15, name: 'Workspace 15', role: 'User' },
        // { id: 16, name: 'Workspace 16', role: 'User' },
        // { id: 17, name: 'Workspace 17', role: 'User' },
        // { id: 18, name: 'Workspace 18', role: 'User' },
        // { id: 19, name: 'Workspace 19', role: 'User' },
        // { id: 20, name: 'Workspace 20', role: 'User' },
        // { id: 21, name: 'Workspace 21', role: 'Admin' },
        // { id: 22, name: 'Workspace 22', role: 'User' },
        // { id: 23, name: 'Workspace 23', role: 'User' },
        // { id: 24, name: 'Workspace 24', role: 'User' },
        // { id: 25, name: 'Workspace 25', role: 'User' },
        // { id: 26, name: 'Workspace 26', role: 'User' },
        // { id: 27, name: 'Workspace 27', role: 'User' },
        // { id: 28, name: 'Workspace 28', role: 'Admin' },
        // { id: 29, name: 'Workspace 29', role: 'User' },
        // { id: 30, name: 'Workspace 30', role: 'User' }
    ]);

    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceDomain, setNewWorkspaceDomain] = useState(['']);
    const [inviteCode, setInviteCode] = useState('');
    const [maxGroupSize, setMaxGroupSize] = useState('');
    const [numGroups, setNumGroups] = useState('');
    const navigate = useNavigate();

    const handleJoinWorkspace = () => {
        alert('Join workspace logic here');
    };

    const handleAddWorkspace = () => {
        const newWorkspace = {
            id: workspaces.length + 1,
            name: newWorkspaceName,
            role: 'Admin',
            maxGroupSize: maxGroupSize,
            numGroups: numGroups
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName('');
        setNewWorkspaceDomain(['']);
        setInviteCode('');
        setMaxGroupSize('');
        setNumGroups('');
    };

    const handleWorkspaceClick = (workspaceId) => {
        const workspace = workspaces.find(w => w.id === workspaceId);
        //navigate(`/GroupsPage/${workspaceId}`, { state: { maxGroupSize: workspace.maxGroupSize, numGroups: workspace.numGroups } });
        navigate(`/groups/${workspaceId}`, { state: { maxGroupSize: workspace.maxGroupSize, numGroups: workspace.numGroups } });
    };

    const handleAddDomain = () => {
        setNewWorkspaceDomain([...newWorkspaceDomain, '']);
    };

    const handleDomainChange = (index, value) => {
        const updatedDomains = newWorkspaceDomain.map((domain, i) => (i === index ? value : domain));
        setNewWorkspaceDomain(updatedDomains);
    };

    const handleDeleteDomain = (index) => {
        const updatedDomains = newWorkspaceDomain.filter((_, i) => i !== index);
        setNewWorkspaceDomain(updatedDomains);
    };

    return (
        <div className="dashboard">
            <h1 className="header-large">Workspaces</h1>
            <div className="container">
                <div className="row workspace-cards">
                    {workspaces.map((workspace) => (
                        <div key={workspace.id} className="workspace-card" onClick={() => handleWorkspaceClick(workspace.id)}>
                            <h2>{workspace.name}</h2>
                            <p>Role: {workspace.role}</p>
                        </div>
                    ))}
                </div>
                <div className="workspace-actions text-center">
                    <button type="button" className="btn btn-primary btn-large mb-4" data-toggle="modal" data-target="#joinWorkspaceModal">
                        Join
                    </button>
                    <button type="button" className="btn btn-success btn-large mb-4" data-toggle="modal" data-target="#createWorkspaceModal">
                        Create
                    </button>
                </div>
            </div>
            {/* Join Workspace Modal */}
            <div className="modal fade" id="joinWorkspaceModal" tabIndex="-1" aria-labelledby="joinWorkspaceModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="joinWorkspaceModalLabel">Join Workspace</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
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
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary" onClick={handleJoinWorkspace}>Join</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Workspace Modal */}
            <div className="modal fade" id="createWorkspaceModal" tabIndex="-1" aria-labelledby="createWorkspaceModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="createWorkspaceModalLabel">Create Workspace</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="Workspace Name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                className="form-control mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Domain Restriction"
                                value={newWorkspaceDomain}
                                onChange={(e) => setNewWorkspaceDomain(e.target.value)}
                                className="form-control mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Max Group Size"
                                value={maxGroupSize}
                                onChange={(e) => setMaxGroupSize(e.target.value)}
                                className="form-control mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Number of Groups"
                                value={numGroups}
                                onChange={(e) => setNumGroups(e.target.value)}
                                className="form-control mb-2"
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-success" onClick={handleAddWorkspace}>Create</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
