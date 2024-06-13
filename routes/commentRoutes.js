import express from "express";
import { Comment } from "../models/commentsModel.js";

const router = express.Router();

// Create a new comment
router.post("/", async (req, res) => {
    try {
        // Get the required fields from the request body
        const { userId, targetId, ratings, text, groupId } = req.body;

        // Check that the user, workspace, and comment fields are present
        if (!userId || !targetId || !ratings || !text || !groupId) {
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Create a new comment
        const newComment = new Comment({ userId, targetId, ratings, text, groupId });
        const savedComment = await newComment.save();

        // Return the created comment
        res.status(201).json(savedComment);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});


// Get comments for a user
router.get("/user/:userId", async (req, res) => {

    try {
        const comments = await Comment.find({ userId: req.params.userId }).populate('userId workspaceId groupId');
        res.status(200).json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }

    // Check if user exists in database
    if (!userData) {
        return res.status(404).json({ message: "The requested user was not found in our database." });
    }
});

// Get comments from a workspace
router.get("/workspace/:workspaceId", async (req, res) => {

    try {
        const comments = await Comment.find({ workspaceId: req.params.workspaceId }).populate('userId workspaceId groupId');
        res.status(200).json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }

    // Check if workspace exists
    if (!workspaceId) {
        return res.status(400).json({ message: "The provided workspace was not found in our database" });
    }
});

// Get all comments for a group
router.get("/group/:groupId", async (req, res) => {
    try {
        const comments = await Comment.find({ groupId: req.params.groupId }).populate('userId workspaceId groupId');
        res.status(200).json(comments);
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