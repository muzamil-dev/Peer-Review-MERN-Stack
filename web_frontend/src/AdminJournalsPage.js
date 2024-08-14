import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import { jwtDecode } from 'jwt-decode';
import './AdminJournalsPage.css';

const AdminJournalsPage = () => {
    const { workspaceId } = useParams();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [journals, setJournals] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [error, setError] = useState('');
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
        fetchWeeks();
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

    const fetchWeeks = async () => {
        try {
            const response = await Api.Workspaces.getWeeks(workspaceId);
            if (response.status === 200) {
                const { past, current } = response.data;
                const pastAndCurrentWeeks = [...past, ...current];
                setWeeks([...new Set(pastAndCurrentWeeks)]);
            } else {
                setError(`Failed to fetch weeks: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            setError('Error fetching weeks.');
        }
    };

    const fetchJournals = async (studentId, week) => {
        try {
            const response = await Api.Workspaces.GetUserJournalsByWorkspaceAdmin(workspaceId, studentId, week);
            if (response.status === 200) {
                setJournals(response.data);
            } else {
                setError(`Failed to fetch journals: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching journals:', error);
            setError('Error fetching journals.');
        }
    };

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        if (studentId && selectedWeek) {
            fetchJournals(studentId, selectedWeek);
        }
    };

    const handleWeekChange = (e) => {
        const week = e.target.value;
        setSelectedWeek(week);
        if (selectedStudent && week) {
            fetchJournals(selectedStudent, week);
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

    return (
        <div className="admin-journals-page">
            <header className="admin-journals-header">
                <button onClick={handleBackClick} className="btn btn-danger">
                    &#8592; Back
                </button>
                <h1 className="admin-journals-title">Manage Student Journals</h1>
            </header>

            <div className="filters">
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

                <div className="filter-group">
                    <label htmlFor="week-select">Select Week:</label>
                    <select id="week-select" value={selectedWeek || ''} onChange={handleWeekChange}>
                        <option value="" disabled>Select a week</option>
                        {weeks.map(week => (
                            <option key={week} value={week}>
                                Week {week}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="journals-list">
                <h2>Journals for Selected Week</h2>
                {error && <div className="error-message">{error}</div>}
                {journals.length === 0 && !error && (
                    <p>No journals found for this week.</p>
                )}
                {journals.length > 0 && (
                    <ul>
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

            {isPopupOpen && (
                <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedJournal.name}</h2>
                        <p><strong>Submitted on:</strong> {selectedJournal.submittedAt ? new Date(selectedJournal.submittedAt).toLocaleDateString() : 'Not submitted'}</p>
                        <p>{selectedJournal.content}</p>
                        <button onClick={() => setIsPopupOpen(false)} className="btn btn-primary">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminJournalsPage;
