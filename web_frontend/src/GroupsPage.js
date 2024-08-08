import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GroupsPage.css'; // Import the CSS file as a module
import Api from './Api.js';
import { jwtDecode } from 'jwt-decode';

const GroupsPageUser = () => {
    const [groups, setGroups] = useState([]);
    const [workspaceDetails, setWorkspaceDetails] = useState({ name: '', groupLock: false });
    const { workspaceId } = useParams(); // Assuming you're using React Router v6
    const navigate = useNavigate();

    const fetchWorkspaceDetails = async () => {
        const response = await Api.Workspaces.GetWorkspaceDetails(workspaceId);
        if (response.status === 200) {
            setWorkspaceDetails(response.data);
        } else {
            console.error('Failed to fetch workspace details:', response.message);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await Api.Workspaces.GetGroups(workspaceId);
            if (response.status === 200 && Array.isArray(response.data)) {
                setGroups(response.data.map(group => ({
                    ...group,
                    members: Array.isArray(group.members) ? group.members.filter(member => member && member.userId) : []
                })));
            } else {
                console.error('Failed to fetch groups:', response.message);
                setGroups([]);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroups([]);
        }
    };

    useEffect(() => {
        fetchWorkspaceDetails();
        fetchGroups();
    }, [workspaceId]);

    const handleDashboard = () => {
        navigate('/DashboardPage'); // Navigate to dashboard page
    };

    const assignmentsPage = () => {
        navigate('/userDashboard'); // Navigate to assignments page
    };

    return (
        <div className="workspaceUser">
            <div className="row headerContainer d-flex justify-content-center align-items-center">
                <div className="col-xl-3 col-lg-3 col-md-3 col-auto text-center">
                    <button className="btn btn-light mb-2" onClick={assignmentsPage}>Assignments</button>
                </div>
                <h1 className="col-xl-6 col-lg-6 col-md-6 col-auto headerLarge text-center">{workspaceDetails.name}</h1>
                <div className="col-xl-3 col-lg-3 col-md-3 col-sm-3 col-auto text-center">
                    <button className="btn btn-light mb-2" onClick={handleDashboard}>Dashboard</button>
                </div>
            </div>

            <div className="container">
                <div className="row">
                    {Array.isArray(groups) && groups.map((group) => (
                        <div key={group.groupId} className="col-12 col-sm-6 col-lg-4 mb-4">
                            <div className="card groupCard">
                                <div className="card-body d-flex flex-column">
                                    <h2 className="card-title">{group.name}</h2>
                                    <ul className="list-unstyled flex-grow-1">
                                        {Array.isArray(group.members) && group.members.map(member => (
                                            <li key={member.userId}>{member.firstName} {member.lastName}</li>
                                        ))}
                                    </ul>
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
