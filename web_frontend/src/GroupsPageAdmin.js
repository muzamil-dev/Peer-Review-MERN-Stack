import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GroupsPage.css';  

const GroupsPageAdmin = () => {
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

    const [editingGroup, setEditingGroup] = useState(null);

    const handleMoveUser = (memberName, newGroupId) => {
        setGroups(groups.map(group => {
            if (group.members.includes(memberName)) {
                return { ...group, members: group.members.filter(member => member !== memberName) };
            }
            if (group.id === newGroupId) {
                return { ...group, members: [...group.members, memberName] };
            }
            return group;
        }));
    };

    const handleRemoveUser = (memberName) => {
        const confirmRemove = window.confirm(
            `Are you sure you would like to remove ${memberName} from the workspace? This action cannot be undone.`
        );
        if (confirmRemove) {
            setGroups(groups.map(group => {
                if (group.members.includes(memberName)) {
                    return { ...group, members: group.members.filter(member => member !== memberName) };
                }
                return group;
            }));
        }
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
                            <button
                                onClick={() => setEditingGroup(group.id)}
                                className="btn btn-primary small-btn mb-2"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {editingGroup !== null && (
                <div
                    className='fixed bg-black bg-opacity-60 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center'
                    onClick={() => setEditingGroup(null)}>
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className='w-[600px] max-w-full h-[400px] bg-white rounded-xl p-4 flex flex-col relative'>
                        <button
                            className='absolute right-6 top-6 text-3xl text-red-600 cursor-pointer'
                            onClick={() => setEditingGroup(null)}
                        >
                            &times;
                        </button>

                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>Group {editingGroup}</h2>
                        </div>

                        <div className='flex'>
                            <div className='w-1/2'>
                                <h3 className='text-lg font-semibold ml-8 mb-4'>Members</h3>
                                {groups.find(group => group.id === editingGroup).members.map((member, index) => (
                                    <div
                                        key={index}
                                        className='flex justify-between items-center gap-x-2 ml-8 text-m mb-2'>
                                        {member}
                                    </div>
                                ))}
                            </div>
                            <div className='w-1/2'>
                                <h3 className='text-lg font-semibold mb-4'>Move To</h3>
                                {groups.find(group => group.id === editingGroup).members.map((member, index) => (
                                    <div key={index} className='mb-2'>
                                        <select
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === 'remove') {
                                                    handleRemoveUser(member);
                                                } else if (value) {
                                                    handleMoveUser(member, parseInt(value));
                                                }
                                            }}
                                            className='border border-gray-700 rounded w-full text-base h-auto'>
                                            <option value=''>Select group</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id} disabled={g.members.length >= maxGroupSize}>
                                                    Group {g.id} {g.members.length >= maxGroupSize ? '(Full)' : ''}
                                                </option>
                                            ))}
                                            <option value='remove'>Remove</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsPageAdmin;
