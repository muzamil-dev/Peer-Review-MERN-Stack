import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import * as Getters from "../shared/getters.js";

const router = express.Router();

// Submit a review
// Required: assignmentId, targetId, ratings
// Optional: text
router.post("/submit", async(req, res) => {
    try {
        // Get the required fields from the request body
        const { assignmentId, userId, targetId, ratings, text } = req.body;
        // Return if required fields are missing
        if (!assignmentId || !userId || !targetId || !ratings) {
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Get the assignment being referred to
        const assignment = await ReviewAssignment.findById(assignmentId);
        // Return if no assignment was found
        if (!assignment)
            return res.status(404).json({ message: "No assignment with the provided id exists" });

        // Check if a review already exists between user/target
        const review = await Review.find({
            assignmentId, userId, targetId
        });
        if (!review)
            return res.status(400).json({ message: "A review for these users already exists" });

        // Check that there is a rating for every question
        if (assignment.questions.length !== ratings.length){
            return res.status(400).json({ message: "There must be one rating for each question" });
        }
        // Get the group id of the reviewer/target
        const groupId = (await Getters.getGroupInWorkspace(
            targetId, assignment.workspaceId
        ))._id;

        // Create a new review
        const newReview = new Review({ assignmentId, userId, targetId, ratings, text, groupId });
        const savedReview = await newReview.save();
        // Return the created review
        res.status(201).json({
            message: "Review submitted successfully",
            reviewId: savedReview._id
        });
    } 
    catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Edit a provided review
// Required: reviewId, ratings
// Optional: text
router.put("/edit", async(req, res) => {
    try{
        // Get required parameters
        const { reviewId, ratings } = req.body;
        // Return if required fields are missing
        if (!reviewId || !ratings)
            return res.status(400).json({ message: "One or more required fields is not present" });

        // Check that the review exists
        const review = await Review.findById(reviewId);
        if (!review)
            return res.status(404).json({ message: "The provided review was not found in our database" });

        // Check that the number of ratings is correct
        if (ratings.length !== review.ratings.length)
            return res.status(400).json({ 
                message: `Mismatch between number of ratings (${ratings.length}) and expected number (${review.ratings.length})`
            });
        // Set the new ratings
        review.ratings = ratings;
        // Add optional fields
        if (req.body.text) review.text = req.body.text;
        // Update the review in the database
        await review.save();
        // Return the edited review
        res.status(201).json({
            message: "Review edited successfully",
            reviewId
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// FIX ROUTES BELOW

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


//Delete a review
router.delete("/:reviewId", async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await review.deleteOne({ __id: reviewId });
        res.status(200).json({ message: "Review deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});


// Get all reviews for a specific groupId. Looks through reviews and returns all reviews with the given groupId.
router.get("/group/:groupId/reviews", async (req, res) => {
    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
    }

    try {
        const reviews = await Review.find({ groupId });

        if (!reviews) {
            return res.status(404).json({ message: "No reviews found for this group" });
        }

        res.status(200).json(reviews);
    } catch (err) {
        console.error("Error occurred:", err.message);
        res.status(500).json({ message: err.message });
    }
});


// Get reviews from a workspace
// router.get("/workspace/:workspaceId", async (req, res) => {

//     try {
//         const reviews = await Review.find({ workspaceId: req.params.workspaceId }).populate('userId workspaceId groupId');
//         res.status(200).json(reviews);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ message: err.message });
//     }

//     // Check if workspace exists
//     if (!workspaceId) {
//         return res.status(400).json({ message: "The provided workspace was not found in our database" });
//     }
// });

export default router;