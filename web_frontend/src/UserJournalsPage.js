import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import {jwtDecode} from 'jwt-decode';
import './UserJournalsPage.css';

const UserJournalsPage = () => {
    const { workspaceId } = useParams();
    const [journals, setJournals] = useState([]);
    const navigate = useNavigate();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login'); // Redirect to login if token is not available
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    };

    const userId = getCurrentUserId();

    useEffect(() => {
        if (userId) {
            fetchJournals();
        }
    }, [userId]);

    const fetchJournals = async () => {
        try {
            const response = await Api.Workspaces.GetStudentJournalsByWorkspace(workspaceId, userId);
            if (response.status === 200) {
                setJournals(response.data);
            } else {
                console.error(`Failed to fetch journals: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching journals:', error);
        }
    };

    const isEditable = (startDate, endDate) => {
        const now = new Date();
        return now >= new Date(startDate) && now <= new Date(endDate);
    };

    const handleJournalClick = (journal) => {
        navigate(`/workspaces/${workspaceId}/journals/${journal.journalAssignmentId}`);
    };

    if (!userId) {
        return <div>Loading...</div>; // Show a loading message while checking authentication
    }

    return (
        <div className="journals-page">
            <header className="journals-header">
                <button onClick={() => navigate('/userDashboard')} className="btn btn-danger">
                    &#8592; Back
                </button>
                <h1 className="journals-title">My Journals</h1>
            </header>

            <div className="journals-list">
                <h2>My Journal Entries</h2>
                {journals.map((journal, index) => (
                    <div 
                        key={index} 
                        className={`journal-entry ${isEditable(journal.startDate, journal.endDate) ? 'editable' : ''}`}
                        onClick={() => handleJournalClick(journal)}
                    >
                        <h3>{journal.name}</h3>
                        <p>Start Date: {new Date(journal.startDate).toLocaleDateString()}</p>
                        <p>End Date: {new Date(journal.endDate).toLocaleDateString()}</p>
                        <p>Submitted on: {journal.submittedAt ? new Date(journal.submittedAt).toLocaleDateString() : 'Not submitted'}</p>
                        {isEditable(journal.startDate, journal.endDate) && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent the click from triggering the onClick of the journal entry
                                    handleJournalClick(journal);
                                }} 
                                className="btn btn-primary">
                                {journal.submittedAt ? 'Edit' : 'Start'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserJournalsPage;
