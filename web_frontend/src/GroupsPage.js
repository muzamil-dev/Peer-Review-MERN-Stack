import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GroupsPage.css';

const GroupsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { maxGroupSize, numGroups } = location.state;

    const userFirstName = 'Firstname'; // Replace with actual name
    const userLastName = 'Lastname'; // Replace with actual last name
    const userFullName = `${userFirstName} ${userLastName}`;

    const [groups, setGroups] = useState(Array.from({ length: numGroups }, (_, index) => ({
        id: index + 1,
        members: []
    })));

    const [joinedGroupId, setJoinedGroupId] = useState(null);

    const handleJoinGroup = (groupId) => {
        if (joinedGroupId !== null) {
            return;
        }
        setGroups(groups.map(group => {
            if (group.id === groupId && group.members.length < maxGroupSize) {
                setJoinedGroupId(groupId);
                return { ...group, members: [...group.members, userFullName] };
            }
            return group;
        }));
    };

    const handleLeaveGroup = (groupId) => {
        setGroups(groups.map(group => {
            if (group.id === groupId) {
                return { ...group, members: group.members.filter(member => member !== userFullName) };
            }
            return group;
        }));
        setJoinedGroupId(null);
    };

    return (
        <div className="groups-page">
            <div className="top-right-container">
                <button className="btn btn-primary" onClick={() => navigate('/DashboardPage')}>
                    Dashboard
                </button>
            </div>
            <h1 className="header-large">Group List</h1>
            <div className="main-container">
                {groups.map(group => (
                    <div key={group.id} className="group-card">
                        <h2>Group {group.id}</h2>
                        <ul>
                            {group.members.map((member, index) => (
                                <li key={index}>{member}</li>
                            ))}
                        </ul>
                        <div className="buttons-container">
                            {group.members.includes(userFullName) ? (
                                <>
                                    <button
                                        className="btn btn-success small-btn mb-2"
                                        disabled
                                    >
                                        Joined
                                    </button>
                                    <button
                                        onClick={() => handleLeaveGroup(group.id)}
                                        className="btn btn-danger small-btn mb-2"
                                    >
                                        Leave
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleJoinGroup(group.id)}
                                    className="btn btn-success small-btn mb-2"
                                    disabled={group.members.length >= maxGroupSize || joinedGroupId !== null}
                                >
                                    {group.members.length >= maxGroupSize ? 'Group Full' : 'Join'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupsPage;
