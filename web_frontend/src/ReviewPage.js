import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Api from './Api';
import './ReviewPage.css';

const ReviewPage = () => {
    const { reviewId } = useParams();
    const [reviewData, setReviewData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const fetchReviewData = async (reviewId) => {
        try {
            console.log('Fetching review data for review ID:', reviewId);
            const response = await Api.Reviews.getReviewById(reviewId);
            if (response.status === 200) {
                setReviewData(response.data);
            } else {
                setErrorMessage(`Failed to fetch review: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching review:', error);
            setErrorMessage(`Failed to fetch review: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    useEffect(() => {
        fetchReviewData(reviewId);
    }, [reviewId]);

    return (
        <div className="review-page">
            <h1>Review</h1>
            {errorMessage && <p className="text-danger">{errorMessage}</p>}
            {reviewData ? (
                <div>
                    <h2>{reviewData.title}</h2>
                    <p>{reviewData.content}</p>
                    {/* Render the review form or details here */}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default ReviewPage;
