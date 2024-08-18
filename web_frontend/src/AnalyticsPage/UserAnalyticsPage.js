import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import Api from "../Api.js";
import "chart.js/auto";
import { Modal, Button } from "react-bootstrap";
import "./UserAnalyticsPage.css";
import { jwtDecode } from "jwt-decode";

const UserAnalyticsPage = () => {
  const { workspaceId, userId } = useParams();
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getCurrentUserId = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return null;
    }
    const decodedToken = jwtDecode(token);
    return decodedToken.userId;
  };

  useEffect(() => {
    const fetchUserAnalytics = async () => {
      try {
        // Get the current user ID
        const adminID = getCurrentUserId();
        if (!adminID) {
          setError("You must be logged in to view this page.");
          return;
        }

        // Fetch analytics data for the user across all assignments in the workspace
        const response = await Api.Workspaces.GetAnalyticsByUserAndWorkspace(
          workspaceId,
          userId,
          adminID
        );
        if (response.status === 200) {
          const analyticsData = response.data;

          // Fetch additional assignment details and reviews
          const assignmentsWithDetails = await Promise.all(
            analyticsData.assignments.map(async (assignment) => {
              try {
                const assignmentInfo = await Api.Assignments.GetAssignmentInfo(
                  assignment.assignmentId
                );
                const assignmentReviews =
                  await Api.Assignments.GetAllReviewsAboutTarget(
                    assignment.assignmentId,
                    userId
                  );
                return {
                  ...assignment,
                  name: assignmentInfo.data.name,
                  questions: assignmentInfo.data.questions, // Use the questions fetched from the assignment info
                  reviews:
                    assignmentReviews.status === 200
                      ? assignmentReviews.data.reviews
                      : [],
                  questionAverages:
                    assignmentReviews.status === 200
                      ? assignmentReviews.data.questionAverages
                      : [],
                };
              } catch (err) {
                console.error("Error fetching assignment details:", err);
                return {
                  ...assignment,
                  error: "Failed to fetch assignment details",
                };
              }
            })
          );

          // Sort assignments by start date
          assignmentsWithDetails.sort(
            (a, b) => new Date(a.startDate) - new Date(b.startDate)
          );

          setUserAnalytics({
            ...analyticsData,
            assignments: assignmentsWithDetails,
          });
        } else {
          setError("Failed to fetch user analytics");
        }
      } catch (err) {
        setError("No analytics found: The user has no assignments.");
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

  const filteredAssignments = userAnalytics.assignments.filter(
    (assignment) => assignment.averageRating !== null
  );
  const assignmentNames = filteredAssignments.map(
    (assignment) => assignment.name
  );
  const averageRatings = filteredAssignments.map(
    (assignment) => assignment.averageRating
  );

  const data = {
    labels: assignmentNames,
    datasets: [
      {
        label: "Average Rating",
        data: averageRatings,
        fill: true,
        backgroundColor: "rgba(173, 216, 230, 0.2)", // Light blue background color
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 0,
        max: 5,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-center text-white">
        User Analytics for {userAnalytics.firstName} {userAnalytics.lastName}
      </h1>
      {userAnalytics.assignments.length > 0 ? (
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-center p-4 bg-white">
            <Line data={data} options={options} />
          </div>
          <div className="">
            <table className="table">
              <thead className="thead-dark">
                <tr className="h-full w-full text-center">
                  <th>Assignment Name</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {userAnalytics.assignments.map((assignment) => (
                  <tr
                    key={assignment.assignmentId}
                    onClick={() => handleAssignmentClick(assignment)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="hover:underline">{assignment.name}</td>
                    <td>
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </td>
                    <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                    <td>
                      {assignment.averageRating !== null
                        ? assignment.averageRating.toFixed(2)
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedAssignment && (
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
              <Modal.Header closeButton>
                <h5 className="text-3xl">Assignment Details</h5>
              </Modal.Header>
              <Modal.Body>
                <div className="flex flex-col items-start justify-center p-3">
                  <h5 className="text-2xl w-full underline">
                    {selectedAssignment.name}
                  </h5>
                  <div className="flex justify-between w-full">
                    <p className="text-black">
                      Start Date:{" "}
                      {new Date(
                        selectedAssignment.startDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-black">
                      Due Date:{" "}
                      {new Date(
                        selectedAssignment.dueDate
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-black">
                    Average Assignment Rating:{" "}
                    {selectedAssignment.averageRating !== null
                      ? selectedAssignment.averageRating.toFixed(2)
                      : "N/A"}
                  </p>
                  <h6 className="text-xl font-bold">Questions:</h6>
                  {selectedAssignment.questions &&
                  selectedAssignment.questions.length > 0 ? (
                    selectedAssignment.questions.map((question, index) => (
                      <div key={index}>
                        <h5 className="text-lg font-normal">
                          {index + 1}: {question}
                        </h5>
                      </div>
                    ))
                  ) : (
                    <div>No questions found</div>
                  )}
                  <h6 className="text-xl font-bold">Reviews:</h6>
                  {selectedAssignment.reviews &&
                  selectedAssignment.reviews.length > 0 ? (
                    selectedAssignment.reviews.map((review, index) => (
                      <div key={index} className="flex flex-col">
                        <h5 className="text-lg">
                          Review by {review.firstName} {review.lastName}:
                        </h5>
                        <ul className="flex flex-col items-start p-1">
                          {review.ratings.map((rating, ratingIndex) => (
                            <li key={ratingIndex}>
                              Average Rating on "
                              {selectedAssignment.questions[ratingIndex]}":{" "}
                              {rating.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        <h5 className="text-start text-sm font-normal">
                          Comments: {review.comment}
                        </h5>
                      </div>
                    ))
                  ) : (
                    <div>No reviews found</div>
                  )}
                </div>
              </Modal.Body>
            </Modal>
          )}
        </div>
      ) : (
        <p className="text-center">No assignments found for this user.</p>
      )}
    </div>
  );
};

export default UserAnalyticsPage;
