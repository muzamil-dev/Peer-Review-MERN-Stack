import express from 'express';

// Import services
import * as AssignmentService from '../services/assignments.js';
import * as ReviewService from '../services/reviews.js';

const router = express.Router();

// Get a specific review by its id
router.get("/:reviewId", async(req, res) => {
    const { reviewId } = req.params;
    // Call the service
    const data = await ReviewService.getById(reviewId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Submit a review
router.post("/submit", async(req, res) => {
    const { userId, reviewId, ratings } = req.body;
    // Check for missing fields
    if (!userId || !reviewId || !ratings)
        return res.status(400).json({ message: "One or more required fields is not present" });
    // Check that ratings is a proper array
    if (!Array.isArray(ratings) || ratings.length < 1)
        return res.status(400).json({ message: "There must be at least one rating provided" });
    // Call the service
    const data = await ReviewService.submit(userId, reviewId, ratings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;