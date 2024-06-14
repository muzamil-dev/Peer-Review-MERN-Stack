import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";

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
router.post("/user/reviews", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const reviews = await Review.find({ userId });
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get reviews for a target user
router.post("/target/reviews", async (req, res) => {
    const { targetId } = req.body;

    if (!targetId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await User.findById(targetId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const reviews = await Review.find({ targetId });
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

//Edit a review.
router.put("/:reviewId", async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { ratings, text } = req.body;

        const review = await Review.findById(reviewId)
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (ratings) {
            review.ratings = ratings;
        }

        if (text) {
            review.text = text;
        }

        const updatedReview = await review.save();
        res.status(200).json(updatedReview);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});


// Get all reviews for a group
router.get("/group/reviews", async (req, res) => {
    const { groupId } = req.body;

    if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
    }

    try{
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "Group not found" });
        }

        const reviews = await Review.find({ groupId });
        res.status(200).json(reviews);
    }catch(err){
        console.error(err.message);
        res.status(500).json({ message: err.message });
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

export default router;