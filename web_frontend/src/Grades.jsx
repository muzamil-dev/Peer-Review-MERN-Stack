import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Api from './Api';
import { useSnackbar } from 'notistack';
import { jwtDecode } from 'jwt-decode';
import './Grades.css';

const Grades = () => {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [averageData, setAverageData] = useState([]); // Initialized as an empty array
    const [completionData, setCompletionData] = useState([]); // Initialized as an empty array
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [view, setView] = useState('average');
    const [perPage] = useState(10);
    const { enqueueSnackbar } = useSnackbar();
    const { workspaceId } = useParams();
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

    const userId = getCurrentUserId();

    useEffect(() => {
        if (workspaceId) {
            fetchAssignments();
        }
    }, [workspaceId]);

    useEffect(() => {
        if (selectedAssignment) {
            if (view === 'average') {
                fetchAverages();
            } else if (view === 'completion') {
                fetchCompletion();
            }
        }
    }, [selectedAssignment, page, view]);

    const fetchAssignments = async () => {
        try {
            const response = await Api.Workspaces.GetAssignments(workspaceId);
            if (response.status === 200) {
                setAssignments(response.data);
                if (response.data.length > 0) {
                    setSelectedAssignment(response.data[0].assignmentId);
                }
            } else {
                enqueueSnackbar(`Failed to fetch assignments: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching assignments', { variant: 'error' });
        }
    };

    const fetchAverages = async () => {
        try {
            const response = await Api.Assignments.GetAveragesByAssignment(selectedAssignment, page, perPage, userId);
            if (response.status === 200) {
                setAverageData(response.data.results || []); // Ensure it's an array
                setTotalResults(response.data.totalResults);
            } else {
                enqueueSnackbar(`Failed to fetch averages: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching averages', { variant: 'error' });
        }
    };

    const fetchCompletion = async () => {
        try {
            const response = await Api.Assignments.GetCompletionByAssignment(selectedAssignment, page, perPage, userId);
            if (response.status === 200) {
                setCompletionData(response.data.results || []); // Ensure it's an array
                setTotalResults(response.data.totalResults);
            } else {
                enqueueSnackbar(`Failed to fetch completion data: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching completion data', { variant: 'error' });
        }
    };

    const handleAssignmentChange = (event) => {
        setSelectedAssignment(event.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const toggleView = () => {
        setView(view === 'average' ? 'completion' : 'average');
        setPage(1);
    };

    return (
        <div className="grades-page-container">
            <h1>Grades Overview</h1>

            <div className="assignment-selector-container">
                <label className="assignment-selector-label" htmlFor="assignment-select">Select Assignment:</label>
                <select
                    id="assignment-select"
                    className="assignment-selector-select"
                    value={selectedAssignment || ''}
                    onChange={handleAssignmentChange}
                >
                    <option value="" disabled>Select an assignment</option>
                    {assignments.map((assignment) => (
                        <option key={assignment.assignmentId} value={assignment.assignmentId}>
                            {assignment.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="view-slider">
                <button className="btn-primary-custom" onClick={toggleView}>
                    {view === 'average' ? 'Switch to Completion Status' : 'Switch to Average Ratings'}
                </button>
            </div>

            {view === 'average' ? (
                <div className="average-ratings-header">
                    <h2>Average Ratings</h2>
                    <table className="grades-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Average Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(averageData) && averageData.map((item, index) => (
                                <tr key={index}>
                                    <td>{`${item.firstName} ${item.lastName}`}</td>
                                    <td>{item.averageRating}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="completion-data-header">
                    <h2>Completion Status</h2>
                    <table className="grades-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Completed Reviews</th>
                                <th>Total Reviews</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(completionData) && completionData.map((item, index) => (
                                <tr key={index}>
                                    <td>{`${item.firstName} ${item.lastName}`}</td>
                                    <td>{item.completedReviews}</td>
                                    <td>{item.totalReviews}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="pagination-controls-container">
                <button className="pagination-controls-button" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                    Previous
                </button>
                <span className="pagination-controls-span">Page {page}</span>
                <button className="pagination-controls-button" onClick={() => handlePageChange(page + 1)} disabled={page * perPage >= totalResults}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default Grades;
