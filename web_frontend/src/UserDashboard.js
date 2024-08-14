import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import {jwtDecode} from 'jwt-decode';
import { useSnackbar } from 'notistack';
import './UserDashboard.css';

const UserDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [pastDueAssignments, setPastDueAssignments] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState('');
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceCompletionStatus, setWorkspaceCompletionStatus] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [reviews, setReviews] = useState({});
    const [selectedReview, setSelectedReview] = useState({});
    const [hasJournals, setHasJournals] = useState(false); // Track if journals exist
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const groupId = 25; // Replace with the actual groupId you need

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/');
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    };

    const fetchWorkspaces = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return;

        try {
            const response = await Api.Users.getUserWorkspaces(currentUserId);
            if (response.status === 200) {
                const studentWorkspaces = response.data.filter(workspace => workspace.role === 'Student');
                studentWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
                setWorkspaces(studentWorkspaces);
                if (studentWorkspaces.length > 0) {
                    setSelectedWorkspace(studentWorkspaces[0].workspaceId);
                    fetchAssignments(studentWorkspaces[0].workspaceId);
                    checkForJournals(studentWorkspaces[0].workspaceId);
                }
            } else {
                setErrorMessage(`Failed to fetch workspaces: ${response.message}`);
                enqueueSnackbar(`Failed to fetch workspaces: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            setErrorMessage(`Failed to fetch workspaces: ${error.response ? error.response.data.message : error.message}`);
            enqueueSnackbar(`Failed to fetch workspaces: ${error.response ? error.response.data.message : error.message}`, { variant: 'error' });
        }
    };

    const fetchAssignments = async (workspaceId) => {
        try {
            const response = await Api.Workspaces.GetAssignments(workspaceId);
            if (response.status === 200) {
                const fetchedAssignments = response.data;
                const now = new Date();

                // Filter assignments based on their due date
                const currentAssignments = fetchedAssignments.filter(assignment => new Date(assignment.dueDate) >= now);
                const pastDueAssignments = fetchedAssignments.filter(assignment => new Date(assignment.dueDate) < now);

                // Fetch and filter reviews for assignments
                const filteredAssignmentsWithReviews = await fetchAndFilterReviews(currentAssignments);
                const filteredPastDueAssignmentsWithReviews = await fetchAndFilterReviews(pastDueAssignments);

                // Update state with filtered assignments and reviews
                setAssignments(fetchedAssignments);
                setFilteredAssignments(filteredAssignmentsWithReviews);
                setPastDueAssignments(filteredPastDueAssignmentsWithReviews);
            } else {
                setErrorMessage(`Failed to fetch assignments: ${response.message}`);
                enqueueSnackbar(`Failed to fetch assignments: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setErrorMessage(`Failed to fetch assignments: ${error.response ? error.response.data.message : error.message}`);
            enqueueSnackbar(`Failed to fetch assignments: ${error.response ? error.response.data.message : error.message}`, { variant: 'error' });
        }
    };

    const checkForJournals = async (workspaceId) => {
        const userId = getCurrentUserId();
        try {
            const response = await Api.Workspaces.GetStudentJournalsByWorkspace(workspaceId, userId);
            if (response.status === 200 && response.data.length > 0) {
                setHasJournals(true);
            } else {
                setHasJournals(false);
            }
        } catch (error) {
            console.error('Error checking for journals:', error);
            setHasJournals(false);
        }
    };

    const fetchReviews = async (assignmentId) => {
        try {
            const response = await Api.Assignments.GetReviewsForUser(assignmentId);
            if (response.status === 200) {
                if (response.data.completedReviews.length > 0 || response.data.incompleteReviews.length > 0) {
                    setReviews(prevReviews => ({
                        ...prevReviews,
                        [assignmentId]: response.data
                    }));
                    return response.data;
                }
            } else {
                setErrorMessage(`Failed to fetch reviews: ${response.message}`);
                enqueueSnackbar(`Failed to fetch reviews: ${response.message}`, { variant: 'error' });
            }
        } catch (error) {
            console.error(`No reviews found for assignment ${assignmentId}`, error);
            enqueueSnackbar(`No reviews found for assignment ${assignmentId}`, { variant: 'info' });
        }
        return null;
    };

    const fetchAndFilterReviews = async (assignments) => {
        const reviewsPromises = assignments.map(async assignment => {
            const reviewData = await fetchReviews(assignment.assignmentId);
            return { ...assignment, reviewData };
        });
        const reviewsData = await Promise.all(reviewsPromises);

        // Filter out assignments with no reviews
        return reviewsData.filter(assignment => assignment.reviewData);
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAssignments(selectedWorkspace);
            checkForJournals(selectedWorkspace);
        }
    }, [selectedWorkspace]);

    const handleWorkspaceChange = (e) => {
        setSelectedWorkspace(e.target.value);
        checkForJournals(e.target.value);
    };

    const handleReviewChange = (assignmentId, reviewId) => {
        setSelectedReview(prevSelectedReview => ({
            ...prevSelectedReview,
            [assignmentId]: reviewId
        }));
    };

    const handleReviewAction = (assignmentId, dueDate) => {
        const now = new Date();
        if (new Date(dueDate) < now) {
            enqueueSnackbar('This assignment is past due and cannot be edited.', { variant: 'error' });
            return;
        }

        const reviewId = selectedReview[assignmentId];
        if (reviewId) {
            navigate(`/Review/${reviewId}`);
        } else {
            console.error('No review selected');
            enqueueSnackbar('No review selected', { variant: 'error' });
        }
    };

    const renderReviewDropdown = (assignmentId, dueDate) => {
        const assignmentReviews = reviews[assignmentId];

        if (!assignmentReviews) return null;

        return (
            <div className="review-dropdown">
                <select
                    value={selectedReview[assignmentId] || ''}
                    onChange={(e) => handleReviewChange(assignmentId, e.target.value)}
                >
                    <option value="" disabled>Select a review</option>
                    {assignmentReviews.incompleteReviews.map((review) => (
                        <option key={review.reviewId} value={review.reviewId}>
                            {review.firstName} {review.lastName} ❌
                        </option>
                    ))}
                    {assignmentReviews.completedReviews.map((review) => (
                        <option key={review.reviewId} value={review.reviewId}>
                            {review.firstName} {review.lastName} ✔️
                        </option>
                    ))}
                </select>
                <button
                    className='btn btn-primary ml-2'
                    onClick={() => handleReviewAction(assignmentId, dueDate)}
                    disabled={!selectedReview[assignmentId]}
                >
                    Edit
                </button>
            </div>
        );
    };

    return (
        <div className="dashboardz">
            <button className="btn btn-light mt-2 back-button" onClick={() => navigate(`/groups/${groupId}`)}>Back</button>
            <h1 className="header-large">Assignments</h1>
            <div className="workspace-selector">
                <label htmlFor="workspace">Workspace: </label>
                <select id="workspace" value={selectedWorkspace} onChange={handleWorkspaceChange}>
                    {workspaces.map((workspace) => (
                        <option key={workspace.workspaceId} value={workspace.workspaceId}>
                            {workspace.name} {workspaceCompletionStatus[workspace.workspaceId] ? '✔️' : '❌'}
                        </option>
                    ))}
                </select>
            </div>

            {hasJournals && (
                <button 
                    className="btn btn-info mt-0 mb-3" 
                    onClick={() => navigate(`/workspaces/${selectedWorkspace}/journals`)}
                >
                    View My Journals
                </button>
            )}

            <h2>Current Assignments</h2>
            <div className="assignments-table">
                <table className="table table-white">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Due Date</th>
                            <th>Start Date</th>
                            <th>Status</th>
                            <th>Reviews</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssignments.map((assignment) => (
                            <tr key={assignment.assignmentId}>
                                <td>{assignment.name}</td>
                                <td>{new Date(assignment.dueDate).toLocaleString()}</td>
                                <td>{new Date(assignment.startDate).toLocaleString()}</td>
                                <td>{(reviews[assignment.assignmentId]?.incompleteReviews.length === 0) ? 'Completed' : 'Incomplete'}</td>
                                <td>{renderReviewDropdown(assignment.assignmentId, assignment.dueDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Past Due Assignments</h2>
            <div className="assignments-table">
                <table className="table table-white">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Due Date</th>
                            <th>Start Date</th>
                            <th>Status</th>
                            <th>Reviews</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pastDueAssignments.map((assignment) => (
                            <tr key={assignment.assignmentId}>
                                <td>{assignment.name}</td>
                                <td>{new Date(assignment.dueDate).toLocaleString()}</td>
                                <td>{new Date(assignment.startDate).toLocaleString()}</td>
                                <td>{(reviews[assignment.assignmentId]?.incompleteReviews.length === 0) ? 'Completed' : 'Incomplete'}</td>
                                <td>{renderReviewDropdown(assignment.assignmentId, assignment.dueDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}
        </div>
    );
};

export default UserDashboard;
