import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import { jwtDecode } from 'jwt-decode';
import './AdminJournalsPage.css';

const AdminJournalsPage = () => {
    const { workspaceId } = useParams();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [journals, setJournals] = useState([]); // Initialize with an empty array
    const [error, setError] = useState('');
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    };

    const fetchStudents = async () => {
        try {
            const response = await Api.Workspaces.GetGroups(workspaceId);
            if (response.status === 200) {
                const students = response.data.reduce((acc, group) => {
                    return acc.concat(group.members);
                }, []);
                setStudents(students);
            } else {
                setError(`Failed to fetch students: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setError('Error fetching students.');
        }
    };

    const fetchJournals = async (studentId) => {
        try {
            const response = await Api.Workspaces.GetUserJournalsByWorkspaceAdmin(workspaceId, studentId);
            if (response.status === 200 && response.data) {
                setJournals(response.data); // Ensure that journals is always an array
            } else {
                setJournals([]); // Set journals to an empty array if no data is returned
                setError(`Failed to fetch journals: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching journals:', error);
            setJournals([]); // Ensure journals is an empty array on error
            setError('Error fetching journals.');
        }
    };

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        if (studentId) {
            fetchJournals(studentId);
        } else {
            setJournals([]); // Reset journals if no student is selected
        }
    };

    const handleJournalClick = (journal) => {
        if (journal.content) {
            setSelectedJournal(journal);
            setIsPopupOpen(true);
        }
    };

    const handleBackClick = () => {
        navigate(`/workspaces/${workspaceId}/admin`);
    };

    const formatContent = (content) => {
        return { __html: content.replace(/\n/g, '<br/>') };
    };

    return (
        <div className="admin-journals-page">
            <div className="sidebar">
                <button onClick={handleBackClick} className="btn btn-danger backAJ">
                    &#8592; Back
                </button>
                <div className="filter-group">
                    <label htmlFor="student-select">Select Student:</label>
                    <select id="student-select" value={selectedStudent || ''} onChange={handleStudentChange}>
                        <option value="" disabled>Select a student</option>
                        {students.map(student => (
                            <option key={student.userId} value={student.userId}>
                                {student.firstName} {student.lastName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="journals-list">
                <h2>Journals for Selected Student</h2>
                {error && <div className="error-message">{error}</div>}
                {!error && Array.isArray(journals) && journals.length === 0 && (
                    <p>No journals found for this student.</p>
                )}
                {!error && Array.isArray(journals) && journals.length > 0 && (
                    <ul className='unordered-list'>
                        {journals.map((journal, index) => (
                            <li
                                key={index}
                                className={`journal-entry ${journal.submittedAt ? '' : 'not-submitted'}`}
                                onClick={() => handleJournalClick(journal)}
                                style={{ cursor: journal.content ? 'pointer' : 'default' }}
                            >
                                <h3>{journal.name}</h3>
                                <p>Submitted on: {journal.submittedAt ? new Date(journal.submittedAt).toLocaleDateString() : 'Not submitted'}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isPopupOpen && selectedJournal && (
                <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedJournal.name}</h2>
                        <p><strong>Submitted on:</strong> {selectedJournal.submittedAt ? new Date(selectedJournal.submittedAt).toLocaleDateString() : 'Not submitted'}</p>
                        <div className="formatted-content" dangerouslySetInnerHTML={formatContent(selectedJournal.content)} />
                        <div className="close-button" onClick={() => setIsPopupOpen(false)}>Close</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminJournalsPage;
