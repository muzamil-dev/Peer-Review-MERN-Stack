import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const Dashboard = () => {
    const [workspaces, setWorkspaces] = useState([
        { id: 1, name: 'Workspace 1', role: 'Admin', code: 'WS1' },
        { id: 2, name: 'Workspace 2', role: 'User', code: 'WS2' },
        { id: 3, name: 'Workspace 3', role: 'User', code: 'WS3' },
        { id: 4, name: 'Workspace 4', role: 'Admin', code: 'WS4' }
    ]);

    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceDomain, setNewWorkspaceDomain] = useState('');
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
            code: `WS${workspaces.length + 1}`
        };
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName('');
        setNewWorkspaceDomain('');
        setCsvFile(null);
        setInviteCode('');
    };

    const handleCsvUpload = (event) => {
        setCsvFile(event.target.files[0]);
    };

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/GroupPage/${workspaceId}`);
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="workspace-cards">
                {workspaces.map((workspace) => (
                    <div key={workspace.id} className="workspace-card" onClick={() => handleWorkspaceClick(workspace.id)}>
                        <h2>{workspace.name}</h2>
                        <p>Role: {workspace.role}</p>
                        <p>Code: {workspace.code}</p>
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
                <input
                    type="text"
                    placeholder="Domain restrictions"
                    value={newWorkspaceDomain}
                    onChange={(e) => setNewWorkspaceDomain(e.target.value)}
                />
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                />
                <button onClick={handleAddWorkspace}>Add</button>
            </div>
        </div>
    );
};

export default Dashboard;