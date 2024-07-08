import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import {jwtDecode} from 'jwt-decode';
import './UserDashboard.css';

const UserDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState('');
    const [workspaces, setWorkspaces] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/');
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    };

    const fetchWorkspaces = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return;

        try {
            const response = await Api.Users.getUserWorkspaces(currentUserId);
            if (response.status === 200) {
                const studentWorkspaces = response.data.filter(workspace => workspace.role === 'Student');
                setWorkspaces(studentWorkspaces);
                if (studentWorkspaces.length > 0) {
                    setSelectedWorkspace(studentWorkspaces[0].workspaceId);
                }
            } else {
                setErrorMessage(`Failed to fetch workspaces: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            setErrorMessage(`Failed to fetch workspaces: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    const fetchAssignments = async (workspaceId) => {
        try {
            const response = await Api.Workspace.GetAssignments(workspaceId, localStorage.getItem('accessToken'));
            if (response.status === 200) {
                setAssignments(response.data);
            } else {
                setErrorMessage(`Failed to fetch assignments: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setErrorMessage(`Failed to fetch assignments: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAssignments(selectedWorkspace);
        }
    }, [selectedWorkspace]);

    const handleWorkspaceChange = (e) => {
        setSelectedWorkspace(e.target.value);
    };

    return (
        <div className="dashboard">
            <h1 className="header-large">Assignments</h1>
            <div className="workspace-selector">
                <label htmlFor="workspace">Workspace: </label>
                <select id="workspace" value={selectedWorkspace} onChange={handleWorkspaceChange}>
                    {workspaces.map((workspace) => (
                        <option key={workspace.workspaceId} value={workspace.workspaceId}>
                            {workspace.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="assignments-table">
                <table className="table table-white">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Due Date</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                                <td>{assignment.name}</td>
                                <td>{new Date(assignment.dueDate).toLocaleString()}</td>
                                <td>{assignment.submitted ? new Date(assignment.submitted).toLocaleString() : '-'}</td>
                                <td>{assignment.completed ? 'Completed' : 'Incomplete'}</td>
                                <td>{assignment.score !== null ? `${assignment.score} / 100` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}
        </div>
    );
};

export default UserDashboard;
