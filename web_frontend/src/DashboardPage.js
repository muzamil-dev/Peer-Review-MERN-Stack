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
    const [newWorkspaceDomains, setNewWorkspaceDomains] = useState(['']);
    const [newWorkspaceMaxSize, setNewWorkspaceMaxSize] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const navigate = useNavigate();

    const handleJoinWorkspace = () => {
        // Logic to join workspace
        alert('Join workspace logic here');
    };

    const handleAddWorkspace = () => {
        // Logic to add workspace
        const newWorkspace = {
            id: workspaces.length + 1,
            name: newWorkspaceName,
            role: 'Admin',
            domains: newWorkspaceDomains.filter(domain => domain.trim() !== ''),
            maxSize: newWorkspaceMaxSize,
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName('');
        setNewWorkspaceDomains(['']);
        setNewWorkspaceMaxSize('');
        setCsvFile(null);
        setInviteCode('');
    };

    const handleCsvUpload = (event) => {
        setCsvFile(event.target.files[0]);
    };

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/GroupPage/${workspaceId}`);
    };

    const handleDomainChange = (index, event) => {
        const newDomains = [...newWorkspaceDomains];
        newDomains[index] = event.target.value;
        setNewWorkspaceDomains(newDomains);
    };

    const handleAddDomain = () => {
        setNewWorkspaceDomains([...newWorkspaceDomains, '']);
    };

    const handleRemoveDomain = (index) => {
        const newDomains = newWorkspaceDomains.filter((_, i) => i !== index);
        setNewWorkspaceDomains(newDomains);
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
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
                    />
                    <button onClick={handleJoinWorkspace}>Join</button>

                    <h2>Add Workspace</h2>
                    <input
                        type="text"
                        placeholder="Workspace name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                    />
                    <div className="domain-restrictions">
                        <h3>Domain Restrictions</h3>
                        {newWorkspaceDomains.map((domain, index) => (
                            <div key={index} className="domain-input">
                                <input
                                    type="text"
                                    placeholder="Domain restriction"
                                    value={domain}
                                    onChange={(e) => handleDomainChange(index, e)}
                                />
                                <button onClick={() => handleRemoveDomain(index)}>Delete</button>
                            </div>
                        ))}
                        <button onClick={handleAddDomain}>Add Domain</button>
                    </div>
                    <input
                        type="text"
                        placeholder="Max group size"
                        value={newWorkspaceMaxSize}
                        onChange={(e) => setNewWorkspaceMaxSize(e.target.value)}
                    />
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                    />
                    <button onClick={handleAddWorkspace}>Add</button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
