import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import * as Getters from "../shared/getters.js";

const router = express.Router();

// View a review
router.get("/view/:reviewId", async(req, res) => {
    try{
        // Get the review
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        // Check if the review exists
        if (!review)
            return res.status(404).json({ message: "No review with the provided id exists" });
        // Get the assignment that the review is from
        const assignment = await ReviewAssignment.findById(review.assignmentId);   
        const reviewArray = review.ratings.map((rating, index) => ({
            question: assignment.questions[index], rating
        }));
        // Return the array
        res.json(reviewArray);
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

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

        // Check that the current date is within the due date
        if (assignment.dueDate < Date.now())
            return res.status(403).json({ message: "The assignment is locked because the due date has passed" });

        // Check for a review between user/target
        const review = await Review.findOne({
            assignmentId, userId, targetId
        });
        if (!review)
            return res.status(400).json({ message: "You were not assigned to review this person" });

        // Check that there is a rating for every question
        if (assignment.questions.length !== ratings.length){
            return res.status(400).json({ message: "There must be one rating for each question" });
        }

        // Add attributes to review
        const saved = await Review.findByIdAndUpdate(
            review._id,
            { ratings, text, completed: true }
        );

        // Return success response
        res.status(201).json({
            message: "Review submitted successfully",
            reviewId: saved._id
        });
    } 
    catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Edit a provided review
// Required: reviewId
// Optional: ratings, text (fields to edit)
router.put("/edit", async(req, res) => {
    try{
        // Get required parameters
        const { reviewId, ratings } = req.body;
        // Return if required fields are missing
        if (!reviewId)
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
        if (ratings){
            if (review.ratings.length === ratings.length)
                review.ratings = ratings;
            else
                return res.status(400).json({ 
                    message: `Mismatch between provided number of ratings (${ratings.length}) and expected number (${review.ratings.length})`
                });
        }
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

// FIX ROUTES BELOW (or remove them)

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

        res.json(reviews);
    } catch (err) {
        console.error("Error occurred:", err.message);
        res.status(500).json({ message: err.message });
    }
});

export default router;