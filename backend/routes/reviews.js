import express from 'express';
import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as AssignmentService from "../services/assignments.js";
import * as ReviewService from "../services/reviews.js";
import * as AnalyticsService from "../services/analytics.js";

const router = express.Router();

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

// Submit a review
router.post("/submit", async(req, res) => {
    let db;
    const { userId, reviewId, ratings, comment } = req.body;
    try{
        // Check that required fields are provided
        if (!reviewId || !ratings)
            throw new HttpError("One or more required fields is not present", 400);
        // Connect to db
        db = await pool.connect();
        await db.query('BEGIN');

        // Get the targetId and assignmentId specified in the review
        const review = await ReviewService.getById(db, reviewId);
        const assignmentId = review.assignmentId;
        const targetId = review.targetId;

        // Check that the user submitting the review is the user listed on the review
        if (userId !== review.userId)
            throw new HttpError("Incorrect review submission", 400);

        // Check that the submission is within the start and end dates
        const startDate = new Date(review.startDate);
        const dueDate = new Date(review.dueDate);
        if (startDate > Date.now() || dueDate < Date.now())
            throw new HttpError("This assignment is not currently active", 400);

        // Questions are sorted by id, the ratings' order is assumed to match the ordering of questions
        if (review.questions.length !== ratings.length)
            throw new HttpError("Incorrect number of ratings given", 400);

        // Submit the review
        const data = await ReviewService.submit(db, reviewId, ratings, comment);
        // Update the analytics for that user
        await AnalyticsService.updateAnalytics(db, targetId, assignmentId);
        await db.query('COMMIT');
        res.json(data);
    }
    catch(err){
        if (db) await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

export default router;