import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import './ReviewPage.css'; // Ensure you create and style this CSS file

const ReviewPage = () => {
    const { reviewId } = useParams(); // Get the review ID from the URL
    const [review, setReview] = useState(null); // State to store the review details
    const [ratings, setRatings] = useState([]); // State to store ratings for each question
    const [comment, setComment] = useState(''); // State to store the comment
    const navigate = useNavigate(); // Navigation hook for redirecting users
    const isCompleted = ratings.length > 0 && !ratings.includes(0); // Check if all ratings are completed

    // Fetch the review data when the component mounts
    useEffect(() => {
        fetchReview();
    }, []);

    // Function to fetch review details from the API
    const fetchReview = async () => {
        try {
            const response = await Api.Reviews.GetReview(reviewId);
            if (response.status === 200) {
                console.log('Fetched review:', response.data); // Log the entire response data
    
                // Set the fetched review data, including comment and ratings
                setReview(response.data);
                setRatings(response.data.ratings || new Array(response.data.questions.length).fill(0));
                setComment(response.data.comment || ''); // Load the existing comment, if available
            } else {
                console.error(`Failed to fetch review: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching review:', error);
        }
    };

    // Handle rating change for a specific question
    const handleRatingChange = (questionIndex, rating) => {
        const updatedRatings = [...ratings];
        updatedRatings[questionIndex] = rating;
        setRatings(updatedRatings);
    };

    // Handle comment change
    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    // Submit the completed review with ratings and comment
    const handleSubmit = async () => {
        const userId = localStorage.getItem('userId');
        try {
            // Include the comment in the submission
            const response = await Api.Reviews.SubmitReview(userId, reviewId, ratings, comment);
            if (response.success) {
                navigate('/userDashboard'); // Redirect to the user dashboard on success
            } else {
                console.error(`Failed to submit review: ${response.message}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    if (!review) {
        return <div>Loading...</div>; // Show a loading message while fetching the review
    }

    return (
        <div className="review-page">
            <header className="review-header">
                <button onClick={() => navigate('/userDashboard')} className="back-button">
                    &#8592; Back
                </button>
                <h1 className="review-title">{review.firstName}'s Form</h1>
                <p className="review-target">Review for {review.targetFirstName} {review.targetLastName}</p>
                <div className="review-details">
                    <span>Due: {new Date(review.dueDate).toLocaleDateString()}</span>
                    <span>Questions: {review.questions.length}</span>
                    <span>Status: <span className={isCompleted ? "status-completed" : "status-pending"}>{isCompleted ? "✔" : "✖"}</span></span>
                </div>
            </header>
            <div className="review-questions">
                {review.questions.map((question, index) => (
                    <div key={index} className="review-question">
                        <h2 className='white-text'>{question}</h2>
                        <div className="rating">
                            {[...Array(5)].map((_, starIndex) => (
                                <span
                                    key={starIndex}
                                    className={` star ${ratings[index] > starIndex ? "selected" : ""}`}
                                    onClick={() => handleRatingChange(index, starIndex + 1)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <p className='white-text'>Rating {ratings[index] || 0} / 5</p>
                    </div>
                ))}
            </div>
            <div className="review-comment">
                <h2>Comment</h2>
                <textarea 
                    value={comment}
                    onChange={handleCommentChange}
                    className="comment-textarea"
                />
            </div>
            <button onClick={handleSubmit} className="btn btn-primary submit-button">Submit</button>
        </div>
    );
};

export default ReviewPage;
