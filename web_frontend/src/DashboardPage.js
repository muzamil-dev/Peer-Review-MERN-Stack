import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
    const [workspaces, setWorkspaces] = useState([
        { id: 1, name: 'Workspace 1', role: 'Admin' },
        { id: 2, name: 'Workspace 2', role: 'User' },
        { id: 3, name: 'Workspace 3', role: 'User' },
        { id: 4, name: 'Workspace 4', role: 'Admin' }
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
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName('');
        setNewWorkspaceDomain(['']);
        setInviteCode('');
        setMaxGroupSize('');
        setNumGroups('');
    };

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/GroupPage/${workspaceId}`);
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
            <h1 className="text-center mb-4">Dashboard</h1>
            <div className="main-container">
                <div className="workspace-cards">
                    {workspaces.map((workspace) => (
                        <div key={workspace.id} className="workspace-card" onClick={() => handleWorkspaceClick(workspace.id)}>
                            <h2>{workspace.name}</h2>
                            <p>Role: {workspace.role}</p>
                        </div>
                    ))}
                </div>
                <div className="workspace-actions">

                    <h2>Join Workspace</h2>
                    <input
                        type="text"
                        placeholder="Enter code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="form-control mb-2 transparent-input"
                    />
                    <button onClick={handleJoinWorkspace} className="btn btn-primary mb-4">Add</button>

                    <h2>Create Workspace</h2>
                    <input
                        type="text"
                        placeholder="Workspace name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="form-control mb-2 transparent-input"
                    />
                    <h3>Domain Restrictions</h3>
                    {newWorkspaceDomain.map((domain, index) => (
                        <div key={index} className="domain-restriction mb-2">
                            <input
                                type="text"
                                placeholder="Domain restriction"
                                value={domain}
                                onChange={(e) => handleDomainChange(index, e.target.value)}
                                className="form-control d-inline-block transparent-input"
                                style={{ width: 'calc(100% - 0px)' }}
                            />
                            <button onClick={() => handleDeleteDomain(index)} className="btn btn-danger ml-2">Delete</button>
                        </div>
                    ))}
                    <button onClick={handleAddDomain} className="btn btn-secondary mb-4">Add</button>

                    <input
                        type="text"
                        placeholder="Max group size"
                        value={maxGroupSize}
                        onChange={(e) => setMaxGroupSize(e.target.value)}
                        className="form-control mb-2 transparent-input"
                    />
                    <input
                        type="text"
                        placeholder="Number of groups"
                        value={numGroups}
                        onChange={(e) => setNumGroups(e.target.value)}
                        className="form-control mb-2 transparent-input"
                    />
                    <button onClick={handleAddWorkspace} className="btn btn-success">Add</button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
