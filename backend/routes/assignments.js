import express from 'express';

// Import services
import * as AssignmentService from '../services/assignments.js';
import * as ReviewService from '../services/reviews.js';

const router = express.Router();

// Get the details of an assignment
router.get("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    // Call the service
    const data = await AssignmentService.getById(assignmentId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Get all reviews created by a user for an assignment
router.get(["/:assignmentId/user", "/:assignmentId/user/:userId"], async(req, res) => {
    const { assignmentId } = req.params;
    const userId = req.params.userId || req.body.userId;
    // Call the service
    const data = await ReviewService.getByAssignmentAndUser(userId, assignmentId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Get all reviews written about a user (target) for an assignment
router.get("/:assignmentId/target/:targetId", async(req, res) => {
    const { assignmentId, targetId } = req.params;
    // Call the service
    const data = await ReviewService.getByAssignmentAndTarget(targetId, assignmentId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Create a new assignment
router.post("/create", async(req, res) => {
    const { userId, workspaceId, name, startDate, dueDate, questions, description } = req.body;
    // Check for required fields
    if (!userId || !workspaceId || !name || !dueDate || !questions){
        return res.status(400).json({ message: "One or more required fields is not present" });
    };
    // Check that questions exists and there is at least one question
    if (!Array.isArray(questions) || questions.length < 1)
        return res.status(400).json({ message: "Assignments must have at least one question" });

    // Build the settings object, these will be used to create the new assignment
    const settings = { name, startDate, dueDate, questions, description };
    // Call the service
    const data = await AssignmentService.create(userId, workspaceId, settings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Edit an assignment
router.put("/edit", async(req, res) => {
    const { userId, assignmentId, name, startDate, dueDate, questions, description } = req.body;
    // Check for required fields
    if (!userId || !assignmentId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    };
    // Check that questions is a proper array if it exists
    if (questions && (!Array.isArray(questions) || questions.length < 1))
        return res.status(400).json({ message: "Assignments must have at least one question" });

    // Build the settings object used to update the assignment
    const settings = { name, startDate, dueDate, questions, description };
    // Call the service
    const data = await AssignmentService.edit(userId, assignmentId, settings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Delete an assignment
router.delete("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    // Check for required fields
    if (!userId || !assignmentId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    };
    // Call the service
    const data = await AssignmentService.deleteAssignment(userId, assignmentId)
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;