import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import { jwtDecode } from 'jwt-decode';
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
                }
                fetchAssignmentsCompletionStatus(studentWorkspaces);
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

    const fetchAssignmentsCompletionStatus = async (workspaces) => {
        const completionStatus = {};

        for (const workspace of workspaces) {
            try {
                const response = await Api.Workspaces.GetAssignments(workspace.workspaceId, localStorage.getItem('accessToken'));
                if (response.status === 200) {
                    const assignments = response.data;
                    const now = new Date();
                    const currentAssignments = assignments.filter(assignment => new Date(assignment.dueDate) >= now);
                    const reviewsData = await fetchAndFilterReviews(currentAssignments);
                    const allCompleted = reviewsData.every(assignment => assignment.reviewData.incompleteReviews.length === 0);
                    completionStatus[workspace.workspaceId] = allCompleted;
                }
            } catch (error) {
                console.error(`Error fetching assignments for workspace ${workspace.workspaceId}:`, error);
            }
        }

        setWorkspaceCompletionStatus(completionStatus);
    };

    const fetchAssignments = async (workspaceId) => {
        try {
            const response = await Api.Workspaces.GetAssignments(workspaceId, localStorage.getItem('accessToken'));
            if (response.status === 200) {
                const fetchedAssignments = response.data;
                const reviewsData = await fetchAndFilterReviews(fetchedAssignments);
                const now = new Date();

                const currentAssignments = reviewsData.filter(assignment => new Date(assignment.dueDate) >= now);
                const pastDueAssignments = reviewsData.filter(assignment => new Date(assignment.dueDate) < now);

                setAssignments(fetchedAssignments);
                setFilteredAssignments(currentAssignments);
                setPastDueAssignments(pastDueAssignments);
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

    const fetchReviews = async (assignmentId) => {
        const userId = getCurrentUserId();
        if (!userId) return;

        try {
            const response = await Api.Assignments.GetAllReviewsByUser(assignmentId, userId, localStorage.getItem('accessToken'));
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
            console.log(`No reviews found for assignment ${assignmentId}`);
            //enqueueSnackbar(`No reviews found for assignment ${assignmentId}`, { variant: 'info' });
        }
        return null;
    };

    const fetchAndFilterReviews = async (assignments) => {
        const reviewsPromises = assignments.map(async assignment => {
            const reviewData = await fetchReviews(assignment.assignmentId);
            return { ...assignment, reviewData };
        });
        const reviewsData = await Promise.all(reviewsPromises);

        const filtered = reviewsData.filter(assignment => assignment.reviewData);
        console.log('filtered', filtered);
        return filtered;
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAssignments(selectedWorkspace);
        }
    }, [selectedWorkspace]);

    const handleWorkspaceChange = (e) => {
        setSelectedWorkspace(e.target.value);
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
                    {/* {assignmentReviews.incompleteReviews.length > 0 ? 'Start' : 'Edit'} */}
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
