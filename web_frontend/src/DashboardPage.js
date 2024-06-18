import React, { useState } from 'react';
import './DashboardPage.css';

const DashboardPage = () => {
    const [workspaces, setWorkspaces] = useState([]);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [newWorkspace, setNewWorkspace] = useState({ name: '', domain: '', csv: null, cloneCode: '' });

    const handleJoinWorkspace = () => {
        // Logic to join workspace using joinCode
        alert(`Joining workspace with code: ${joinCode}`);
    };

    const handleCreateWorkspace = () => {
        // Logic to create new workspace
        alert(`Creating workspace: ${JSON.stringify(newWorkspace)}`);
    };

    const handleCsvUpload = (e) => {
        setNewWorkspace({ ...newWorkspace, csv: e.target.files[0] });
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="workspace-container">
                {workspaces.map((workspace, index) => (
                    <div key={index} className="workspace-card">
                        <h3>{workspace.name}</h3>
                        <p>{workspace.role}</p>
                    </div>
                ))}
            </div>
            <div className="buttons">
                <button onClick={() => setShowJoinForm(!showJoinForm)}>Join Workspace</button>
                <button onClick={() => setShowCreateForm(!showCreateForm)}>Create Workspace</button>
            </div>
            {showJoinForm && (
                <div className="join-form">
                    <h2>Join Workspace</h2>
                    <input
                        type="text"
                        placeholder="Enter join code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <button onClick={handleJoinWorkspace}>Join</button>
                </div>
            )}
            {showCreateForm && (
                <div className="create-form">
                    <h2>Create Workspace</h2>
                    <input
                        type="text"
                        placeholder="Workspace Name"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Domain Restrictions"
                        value={newWorkspace.domain}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, domain: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Clone Code (optional)"
                        value={newWorkspace.cloneCode}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, cloneCode: e.target.value })}
                    />
                    <input type="file" onChange={handleCsvUpload} />
                    <button onClick={handleCreateWorkspace}>Create</button>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
