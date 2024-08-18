import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import {jwtDecode} from 'jwt-decode'; // Corrected import
import './SubmitJournal.css';

const SubmitJournal = () => {
    const { journalAssignmentId, workspaceId } = useParams();
    const [journal, setJournal] = useState(null);
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [isEditable, setIsEditable] = useState(false);
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
            fetchJournal();
        }
    }, [userId]);

    const fetchJournal = async () => {
        try {
            const response = await Api.Journals.GetJournalById(journalAssignmentId, userId);
            if (response.status === 200) {
                setJournal(response.data);
                setContent(response.data.content || ''); // Load existing content if available
                checkIfEditable(response.data.startDate, response.data.endDate);
            } else {
                console.error(`Failed to fetch journal: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching journal:', error);
        }
    };

    const checkIfEditable = (startDate, endDate) => {
        const now = new Date();
        setIsEditable(now >= new Date(startDate) && now <= new Date(endDate));
    };

    const handleSubmit = async () => {
        if (!journal || !isEditable) return;

        try {
            const response = await Api.Journals.SubmitJournalEntry(journalAssignmentId, userId, content);
            if (response.status === 201) {
                navigate(`/workspaces/${workspaceId}/journals`); // Redirect to UserJournalsPage after submission
            } else {
                console.error(`Failed to submit journal: ${response.message}`);
                setError(`Failed to submit journal: ${response.message}`);
            }
        } catch (error) {
            console.error('Error submitting journal:', error);
            setError('Error submitting journal.');
        }
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
    };

    if (!userId || !journal) {
        return <div>Loading...</div>; // Show a loading message while checking authentication
    }

    const formatContent = (content) => {
        return { __html: content.replace(/\n/g, '<br/>') };
    };
    

    return (
        <div className="submit-journal-page">
            <header className="submit-journal-header">
                <button onClick={() => navigate(`/workspaces/${workspaceId}/journals`)} className="submit-journal-back-button">
                    &#8592; Back
                </button>
                <h1 className="submit-journal-title">{journal.name}</h1>
                <div className="submit-journal-dates">
                    <p className="submit-journal-date"><strong>Start Date:</strong> {new Date(journal.startDate).toLocaleDateString()}</p>
                    <p className="submit-journal-date"><strong>End Date:</strong> {new Date(journal.endDate).toLocaleDateString()}</p>
                </div>
            </header>

            <div className="submit-journal-content">
                <textarea
                    placeholder="Write or edit your journal entry here..."
                    value={content}
                    onChange={handleContentChange}
                    className="submit-journal-textarea"
                    disabled={!isEditable} // Disable textarea if not editable
                />
                {error && <div className="submit-journal-error-message">{error}</div>}
                <button 
                    onClick={handleSubmit} 
                    className="submit-journal-submit-button"
                    disabled={!isEditable} // Disable button if not editable
                >
                    Submit
                </button>
                {!isEditable && (
                    <div className="submit-journal-info-message">
                        You cannot edit this journal because it is past or before the submission period.
                    </div>
                )}
            </div>
        </div>
    );    
};

export default SubmitJournal;