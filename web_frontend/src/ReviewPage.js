import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import './ReviewPage.css'; // Ensure you create and style this CSS file

const ReviewPage = () => {
    const { reviewId } = useParams();
    const [review, setReview] = useState(null);
    const [ratings, setRatings] = useState([]);
    const navigate = useNavigate();
    const isCompleted = ratings.length > 0 && !ratings.includes(0);

    useEffect(() => {
        fetchReview();
    }, []);

    const fetchReview = async () => {
        try {
            const response = await Api.Reviews.GetReview(reviewId, localStorage.getItem('accessToken'));
            if (response.status === 200) {
                //console.log('API Response:', response.data);
                setReview(response.data);
                setRatings(response.data.ratings || new Array(response.data.questions.length).fill(0));
            } else {
                console.error(`Failed to fetch review: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching review:', error);
        }
    };

    const handleRatingChange = (questionIndex, rating) => {
        const updatedRatings = [...ratings];
        updatedRatings[questionIndex] = rating;
        setRatings(updatedRatings);
    };

    const handleSubmit = async () => {
        const userId = localStorage.getItem('userId');
        try {
            //console.log('Submitting review:', userId, reviewId, ratings);
            //console.log('Target ID:', review.targetId);
            const response = await Api.Reviews.SubmitReview(userId, reviewId, ratings, localStorage.getItem('accessToken'));
            if (response.success) {
                //console.log('Review submitted successfully');
                navigate('/userDashboard');
            } else {
                console.error(`Failed to submit review: ${response.message}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    if (!review) {
        return <div>Loading...</div>;
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
                        <h2>{question}</h2>
                        <div className="rating">
                            {[...Array(5)].map((_, starIndex) => (
                                <span
                                    key={starIndex}
                                    className={`star ${ratings[index] > starIndex ? "selected" : ""}`}
                                    onClick={() => handleRatingChange(index, starIndex + 1)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <p>Rating {ratings[index] || 0} / 5</p>
                    </div>
                ))}
            </div>
            <button onClick={handleSubmit} className="btn btn-primary submit-button">Submit</button>
        </div>
    );
};

export default ReviewPage;
