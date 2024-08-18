import express from 'express';
import { query } from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as AssignmentService from "../services/assignments.js";
import * as ReviewService from "../services/reviews.js";
import * as AnalyticsService from "../services/analytics.js";

const router = express.Router();

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

// Get a review
router.get("/:reviewId", async(req, res) => {
    const { reviewId } = req.params;
    const { userId } = req.body;
    try {
        // Get the review
        const review = await ReviewService.getById(reviewId);
        // Check that the correct user is viewing it
        if (userId !== review.userId)
            throw new HttpError("User is not authorized to view this resource", 403);
        return res.json(review);
    }
    catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Submit a review
router.post("/submit", async(req, res) => {
    const { userId, reviewId, ratings, comment } = req.body;
    try {
        // Check that required fields are provided
        if (!reviewId || !ratings)
            throw new HttpError("One or more required fields is not present", 400);

        // Submit the review
        const data = await ReviewService.submit(userId, reviewId, ratings, comment);
        res.json(data);
    }
    catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

export default router;
