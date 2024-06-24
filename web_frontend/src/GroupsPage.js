import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './GroupsPage.css';

const GroupsPage = () => {
    const location = useLocation();
    const { maxGroupSize, numGroups } = location.state || { maxGroupSize: '', numGroups: '' };

    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [members, setMembers] = useState({}); // { groupId: number }

    useEffect(() => {
        // Initialize groups based on the number of groups and max group size
        if (numGroups) {
            const initialGroups = Array.from({ length: numGroups }, (_, i) => ({
                id: i + 1,
                name: `Group ${i + 1}`,
                description: `This is Group ${i + 1}`,
                maxGroupSize: maxGroupSize,
                members: []
            }));
            setGroups(initialGroups);
        }
    }, [numGroups, maxGroupSize]);

    const handleAddGroup = () => {
        if (!newGroupName || !newGroupDescription) {
            alert("Group name and description cannot be empty");
            return;
        }

        const newGroup = {
            id: groups.length + 1,
            name: newGroupName,
            description: newGroupDescription,
            maxGroupSize: maxGroupSize,
            members: []
        };
        setGroups([...groups, newGroup]);
        setNewGroupName('');
        setNewGroupDescription('');
    };

    const handleAddMember = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (group.members.length >= group.maxGroupSize) {
            alert(`This group has reached its maximum size of ${group.maxGroupSize} members`);
            return;
        }

        const newMember = prompt("Enter new member's name:");
        if (newMember) {
            const updatedGroups = groups.map(g =>
                g.id === groupId ? { ...g, members: [...g.members, newMember] } : g
            );
            setGroups(updatedGroups);
        }
    };

    return (
        <div className="groups-page">
            <h1 className="text-center mb-4">Groups</h1>
            <div className="main-container">
                <div className="group-cards">
                    {groups.map((group) => (
                        <div key={group.id} className="group-card">
                            <h2>{group.name}</h2>
                            <p>{group.description}</p>
                            <p>Max Group Size: {group.maxGroupSize}</p>
                            <p>Current Members: {group.members.length}</p>
                            <button onClick={() => handleAddMember(group.id)} className="btn btn-primary mb-2">
                                Add Member
                            </button>
                            <ul>
                                {group.members.map((member, index) => (
                                    <li key={index}>{member}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="group-actions">
                    <h2>Create Group</h2>
                    <input
                        type="text"
                        placeholder="Group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="form-control mb-2"
                    />
                    <textarea
                        placeholder="Group description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        className="form-control mb-2"
                        rows="3"
                    />
                    <button onClick={handleAddGroup} className="btn btn-success">Create</button>
                </div>
            </div>
        </div>
    );
};

export default GroupsPage;
