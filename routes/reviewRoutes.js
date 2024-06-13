import express from "express";
import { Review } from "../models/reviewsModel.js";

const router = express.Router();

// Create a new review
router.post("/", async (req, res) => {
    try {
        // Get the required fields from the request body
        const { userId, targetId, ratings, text, groupId } = req.body;

        // Check that the user, workspace, and review fields are present
        if (!userId || !targetId || !ratings || !text || !groupId) {
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Create a new review
        const newReview = new Review({ userId, targetId, ratings, text, groupId });
        const savedReview = await newReview.save();

        // Return the created review
        res.status(201).json(savedReview);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});


// Get reviews for a user
router.get("/user/:userId", async (req, res) => {

    try {
        const reviews = await Review.find({ userId: req.params.userId }).populate('userId workspaceId groupId');
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }

    // Check if user exists in database
    if (!userData) {
        return res.status(404).json({ message: "The requested user was not found in our database." });
    }
});

// Get reviews from a workspace
router.get("/workspace/:workspaceId", async (req, res) => {

    try {
        const reviews = await Review.find({ workspaceId: req.params.workspaceId }).populate('userId workspaceId groupId');
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }

    // Check if workspace exists
    if (!workspaceId) {
        return res.status(400).json({ message: "The provided workspace was not found in our database" });
    }
});

// Get all reviews for a group
router.get("/group/:groupId", async (req, res) => {
    try {
        const reviews = await Review.find({ groupId: req.params.groupId }).populate('userId workspaceId groupId');
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }

    // Check if group exists
    if (!groupId) {
        return res.status(400).json({ message: "The provided group was not found in our database" });
    }
});

export default router;