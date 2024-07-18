import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Api from './Api.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'chart.js/auto';
import { Modal, Button } from 'react-bootstrap';
import styles from './UserAnalyticsPage.module.css';
import { jwtDecode } from 'jwt-decode';

const UserAnalyticsPage = () => {
    const { workspaceId, userId } = useParams();
    const navigate = useNavigate();
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    useEffect(() => {
        const fetchUserAnalytics = async () => {
            try {
                //get current user id
                const adminID = getCurrentUserId();
                const response = await Api.Analytics.GetAnalyticsForUser(userId, workspaceId, adminID);
                if (response.status === 200) {
                    const analyticsData = response.data;

                    const assignmentsWithDetails = await Promise.all(
                        analyticsData.assignments.map(async (assignment) => {
                            try {
                                const assignmentInfo = await Api.Assignments.GetAssignmentInfo(assignment.assignmentId);
                                const assignmentReviews = await Api.Assignments.GetAllReviewsAboutTarget(assignment.assignmentId, userId);
                                return {
                                    ...assignment,
                                    name: assignmentInfo.data.name,
                                    questions: assignmentReviews.status === 200 ? assignmentReviews.data.questions : [],
                                    reviews: assignmentReviews.status === 200 ? assignmentReviews.data.reviews : [],
                                    questionAverages: assignmentReviews.status === 200 ? assignmentReviews.data.questionAverages : []
                                };
                            } catch (err) {
                                console.error("Error fetching assignment details:", err);
                                return { ...assignment, error: 'Failed to fetch assignment details' };
                            }
                        })
                    );

                    // Sort assignments by start date
                    assignmentsWithDetails.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                    setUserAnalytics({ ...analyticsData, assignments: assignmentsWithDetails });
                } else {
                    setError('Failed to fetch user analytics');
                }
            } catch (err) {
                setError('No analytics found: The user has not recieved any reviews yet.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserAnalytics();
    }, [workspaceId, userId]);

    const handleAssignmentClick = (assignment) => {
        setSelectedAssignment(assignment);
        setShowModal(true);
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    const filteredAssignments = userAnalytics.assignments.filter(assignment => assignment.averageRating !== null);
    const assignmentNames = filteredAssignments.map(assignment => assignment.name);
    const averageRatings = filteredAssignments.map(assignment => assignment.averageRating);

    const data = {
        labels: assignmentNames,
        datasets: [
            {
                label: 'Average Rating',
                data: averageRatings,
                fill: true,
                backgroundColor: 'rgba(173, 216, 230, 0.2)', // Light blue background color
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const options = {
        scales: {
            y: {
                min: 0,
                max: 5
            }
        }
    };

    return (
        <div className={` ${styles.container} mt-5`}>
            <Button className="btn btn-light" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            <h1 className="text-center">User Analytics for {userAnalytics.firstName} {userAnalytics.lastName}</h1>
            {userAnalytics.assignments.length > 0 ? (
                <>
                    <div className={`chart-container mt-4 ${styles.chartContainer}`}>
                        <Line data={data} options={options} />
                    </div>
                    <div className="table-responsive mt-4">
                        <table className={`table table-striped table-bordered mt-3 ${styles.table}`}>
                            <thead className="thead-dark">
                                <tr>
                                    {/* <th>Assignment ID</th> */}
                                    <th>Assignment Name</th>
                                    <th>Start Date</th>
                                    <th>Due Date</th>
                                    <th>Average Rating</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userAnalytics.assignments.map((assignment) => (
                                    <tr key={assignment.assignmentId} onClick={() => handleAssignmentClick(assignment)} style={{ cursor: 'pointer' }}>
                                        {/* <td>{assignment.assignmentId}</td> */}
                                        <td>{assignment.name}</td>
                                        <td>{new Date(assignment.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                                        <td>{assignment.averageRating !== null ? assignment.averageRating.toFixed(2) : 'N/A'}</td>
                                        <td><Button className="button-custom">View Details</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedAssignment && (
                        <Modal show={showModal} onHide={() => setShowModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Assignment Details</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <h5>Assignment Name: {selectedAssignment.name}</h5>
                                <p>Start Date: {new Date(selectedAssignment.startDate).toLocaleDateString()}</p>
                                <p>Due Date: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                                <p>Average Rating: {selectedAssignment.averageRating !== null ? selectedAssignment.averageRating.toFixed(2) : 'N/A'}</p>
                                <h6>Questions & Ratings:</h6>
                                {selectedAssignment.questionAverages && selectedAssignment.questionAverages.length > 0 ? (
                                    selectedAssignment.questionAverages.map((qa, index) => (
                                        <div key={index}>
                                            <strong>{qa.question}</strong>: {qa.averageRating.toFixed(2)}
                                        </div>
                                    ))
                                ) : (
                                    <div>No questions found</div>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                            </Modal.Footer>
                        </Modal>
                    )}
                </>
            ) : (
                <p className="text-center">No assignments found for this user.</p>
            )}
        </div>
    );
};

export default UserAnalyticsPage;
