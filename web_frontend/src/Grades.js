import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Api from './Api';
import { useSnackbar } from 'notistack';
import { jwtDecode } from 'jwt-decode';
import './Grades.css';

const Grades = () => {
    const [assignments, setAssignments] = useState([]); // State to store the list of assignments
    const [selectedAssignment, setSelectedAssignment] = useState(''); // State to store the selected assignment ID
    const [averageData, setAverageData] = useState([]); // State to store the average ratings data
    const [completionData, setCompletionData] = useState([]); // State to store the completion data
    const [page, setPage] = useState(1); // Pagination state
    const [totalResults, setTotalResults] = useState(0); // Total number of results
    const [view, setView] = useState('average'); // State to control view (average or completion)
    const [perPage] = useState(10); // Number of items per page
    const { enqueueSnackbar } = useSnackbar(); // Snackbar for notifications
    const { workspaceId } = useParams(); // Get the workspaceId from the URL params
    const navigate = useNavigate();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/'); // Redirect to login if token is not available
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    };

    const userId = getCurrentUserId();

    // Fetch the list of assignments when the component mounts or when workspaceId changes
    useEffect(() => {
        if (workspaceId) {
            fetchAssignments();
        }
    }, [workspaceId]);

    // Fetch the data for the selected assignment whenever it changes
    useEffect(() => {
        if (selectedAssignment) {
            if (view === 'average') {
                fetchAverages();
            } else if (view === 'completion') {
                fetchCompletion();
            }
        }
    }, [selectedAssignment, page, view]);

    // Function to fetch the list of assignments in the workspace
    const fetchAssignments = async () => {
        try {
            const response = await Api.Workspaces.GetAssignments(workspaceId);
            if (response.status === 200) {
                setAssignments(response.data);
                if (response.data.length > 0) {
                    setSelectedAssignment(response.data[0].assignmentId); // Select the first assignment by default
                }
            } else {
                enqueueSnackbar(`Failed to fetch assignments: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching assignments', { variant: 'error' });
        }
    };

    // Function to fetch the average ratings for the selected assignment
    const fetchAverages = async () => {
        try {
            const response = await Api.Assignments.GetAveragesByAssignment(selectedAssignment, page, perPage, userId);
            if (response.status === 200) {
                setAverageData(response.data.results);
                setTotalResults(response.data.totalResults);
            } else {
                enqueueSnackbar(`Failed to fetch averages: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching averages', { variant: 'error' });
        }
    };

    // Function to fetch the completion data for the selected assignment
    const fetchCompletion = async () => {
        try {
            const response = await Api.Assignments.GetCompletionByAssignment(selectedAssignment, page, perPage, userId);
            if (response.status === 200) {
                setCompletionData(response.data.results);
                setTotalResults(response.data.totalResults);
            } else {
                enqueueSnackbar(`Failed to fetch completion data: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error fetching completion data', { variant: 'error' });
        }
    };

    // Function to handle assignment change
    const handleAssignmentChange = (event) => {
        setSelectedAssignment(event.target.value);
        setPage(1); // Reset page to 1 when assignment changes
    };

    // Function to handle pagination
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Function to toggle between views
    const toggleView = () => {
        setView(view === 'average' ? 'completion' : 'average');
        setPage(1); // Reset to the first page when changing views
    };

    return (
        <div className="grades-page">
            <h1>Grades Overview</h1>

            {/* Assignment Selector */}
            <div className="assignment-selector">
                <label htmlFor="assignment-select">Select Assignment:</label>
                <select
                    id="assignment-select"
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

            {/* Slider to switch between views */}
            <div className="view-slider">
                <button class = "btn btn-primary" onClick={toggleView}>
                    {view === 'average' ? 'Switch to Completion Status' : 'Switch to Average Ratings'}
                </button>
            </div>

            {view === 'average' ? (
                <div className="average-ratings">
                    <h2>Average Ratings</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Average Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {averageData.map((item, index) => (
                                <tr key={index}>
                                    <td>{`${item.firstName} ${item.lastName}`}</td>
                                    <td>{item.averageRating}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="completion-data">
                    <h2>Completion Status</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Completed Reviews</th>
                                <th>Total Reviews</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completionData.map((item, index) => (
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

            {/* Pagination Controls */}
            <div className="pagination-controls">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                    Previous
                </button>
                <span>Page {page}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page * perPage >= totalResults}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default Grades;
