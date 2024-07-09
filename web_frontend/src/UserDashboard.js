import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import {jwtDecode} from 'jwt-decode';
import './UserDashboard.css';
//import e from 'express';

const UserDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState('');
    const [workspaces, setWorkspaces] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [reviews, setReviews] = useState({});
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

    const fetchWorkspaces = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return;

        try {
            const response = await Api.Users.getUserWorkspaces(currentUserId);
            if (response.status === 200) {
                const studentWorkspaces = response.data.filter(workspace => workspace.role === 'Student');
                setWorkspaces(studentWorkspaces);
                if (studentWorkspaces.length > 0) {
                    setSelectedWorkspace(studentWorkspaces[0].workspaceId);
                }
            } else {
                setErrorMessage(`Failed to fetch workspaces: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            setErrorMessage(`Failed to fetch workspaces: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    const fetchAssignments = async (workspaceId) => {
        try {
            const response = await Api.Workspace.GetAssignments(workspaceId, localStorage.getItem('accessToken'));
            console.log(response);
            if (response.status === 200) {
                // print the name and id of the assignments to the 
                console.log(response.data);
                console.log(response.data[0].name);
                console.log(response.data[0].id);
                setAssignments(response.data);
            } else {
                setErrorMessage(`Failed to fetch assignments: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setErrorMessage(`Failed to fetch assignments: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    const fetchReviews = async (assignmentId) => {
        const userId = getCurrentUserId();
        if(!userId) return;

        try {
            const response = await Api.Assignments.GetAllReviewsByUser(assignmentId, userId, localStorage.getItem('accessToken'));
            if (response.status === 200) {
                setReviews(prevReviews => ({
                    ...prevReviews,
                    [assignmentId]: response.data
                }));
            }else{
                setErrorMessage(`Failed to fetch reviews: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setErrorMessage(`Failed to fetch reviews: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAssignments(selectedWorkspace);
        }
    }, [selectedWorkspace]);

    useEffect(() => {
        if (assignments.length > 0) {
            assignments.forEach(assignment => {
                fetchReviews(assignment.assignmentId);
            });
        }
    }, [assignments]);

    const handleWorkspaceChange = (e) => {
        setSelectedWorkspace(e.target.value);
    };

    const handleReviewAction = (reviewId, isCompleted) => {
        if (isCompleted) {
            // Navigate to edit review page
            navigate(`/editReview/${reviewId}`);
        } else {
            // Navigate to start review page
            navigate(`/startReview/${reviewId}`);
        }
    };

    const renderReviewDropdown = (assignmentId) => {
        const assignmentReviews = reviews[assignmentId];
        console.log(assignmentReviews);
    
        if (!assignmentReviews) return null;
        //if(assignmentReviews.)
        if (assignmentReviews.incompleteReviews.length === 0 && assignmentReviews.completedReviews.length === 0) {
            return <div>No reviews found</div>;
        }
            
    
        return (
            <div className="review-dropdown">
                <select>
                    {assignmentReviews.incompleteReviews.map((review) => (
                        <option key={review.reviewId} value={review.reviewId}>
                            {review.firstName} {review.lastName}
                        </option>
                    ))}
                    {assignmentReviews.completedReviews.map((review) => (
                        <option key={review.reviewId} value={review.reviewId}>
                            {review.firstName} {review.lastName}
                        </option>
                    ))}
                </select>
                {assignmentReviews.incompleteReviews.length > 0 && (
                    <button className='btn btn-primary'
                        onClick={() => handleReviewAction(assignmentReviews.incompleteReviews[0].reviewId, false)}>
                        Start
                    </button>
                )}
                {assignmentReviews.completedReviews.length > 0 && (
                    <button className='btn btn-primary'
                        onClick={() => handleReviewAction(assignmentReviews.completedReviews[0].reviewId, true)}>
                        Edit
                    </button>
                )}
            </div>
        );
    };


    return (
        <div className="dashboardz">
            <h1 className="header-large">Assignments</h1>
            <div className="workspace-selector">
                <label htmlFor="workspace">Workspace: </label>
                <select id="workspace" value={selectedWorkspace} onChange={handleWorkspaceChange}>
                    {workspaces.map((workspace) => (
                        <option key={workspace.workspaceId} value={workspace.workspaceId}>
                            {workspace.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="assignments-table">
                <table className="table table-white">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Due Date</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Reviews</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map((assignment) => (
                            <tr key={assignment.assignmentId}>
                                <td>{assignment.name}</td>
                                <td>{new Date(assignment.dueDate).toLocaleString()}</td>
                                <td>{assignment.submitted ? new Date(assignment.submitted).toLocaleString() : '-'}</td>
                                <td>{assignment.completed ? 'Completed' : 'Incomplete'}</td>
                                <td>{renderReviewDropdown(assignment.assignmentId)}</td>
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
