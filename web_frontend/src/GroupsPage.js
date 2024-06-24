import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './GroupsPage.css';

const GroupsPage = () => {
    const location = useLocation();
    const { maxGroupSize, numGroups } = location.state;

    // Assuming you get the user's first and last name from a user context or prop
    const userFirstName = 'John'; // Replace with actual user data
    const userLastName = 'Doe'; // Replace with actual user data
    const userFullName = `${userFirstName} ${userLastName}`;

    const [groups, setGroups] = useState(Array.from({ length: numGroups }, (_, index) => ({
        id: index + 1,
        members: []
    })));

    const handleJoinGroup = (groupId) => {
        setGroups(groups.map(group => {
            if (group.id === groupId && group.members.length < maxGroupSize && !group.members.includes(userFullName)) {
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
    };

    return (
        <div className="groups-page">
            <div className="top-right-container">
                <button className="btn btn-primary">Dashboard</button>
            </div>
            <h1 className="header-large">Groups</h1>
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
                                        Leave Group
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleJoinGroup(group.id)}
                                    className="btn btn-success small-btn mb-2"
                                    disabled={group.members.length >= maxGroupSize}
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
