import express from 'express';
import { query } from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as AssignmentService from "../services/assignments.js";
import * as ReviewService from "../services/reviews.js";
import * as WorkspaceService from '../services/workspaces.js';
import * as AnalyticsService from '../services/analytics.js';

const router = express.Router();

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

// Get the details of an assignment
router.get("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    try{
        // Call the service
        const data = await AssignmentService.getById(query, assignmentId);
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Get all reviews created by a user for an assignment
router.get(["/:assignmentId/user", "/:assignmentId/user/:userId"], async(req, res) => {
    const { assignmentId } = req.params;
    let userId;
    try{
        // If a route parameter was provided, check that the person viewing is an instructor
        if (req.params.userId){
            // Check that the user is an instructor of the assignment's workspace
            await AssignmentService.checkInstructor(query, req.body.userId, assignmentId);
            userId = req.params.userId;
        }
        else
            userId = req.body.userId;
        // Call the service
        const data = await ReviewService.getByAssignmentAndUser(query, userId, assignmentId);
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Get all reviews written about a user (target) for an assignment
router.get("/:assignmentId/target/:targetId", async(req, res) => {
    const { assignmentId, targetId } = req.params;
    const { userId } = req.body;
    try{
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(query, userId, assignmentId);
        // Call the service
        const data = await ReviewService.getByAssignmentAndTarget(query, targetId, assignmentId);
        // Send the data back
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Get averages for an assignment. Sorted lowest to highest
router.get("/:assignmentId/averages", async(req, res) => {
    const { assignmentId } = req.params;
    const { page, perPage } = req.query;
    const { userId } = req.body;
    try{
        // Check for query parameters
        if (!page || !perPage)
            throw new HttpError(
                "Page and per page query parameters must be provided", 400
            );
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(query, userId, assignmentId);
        // Call the service
        const data = await AnalyticsService.getAveragesByAssignment(query, assignmentId, page, perPage);
        // Send the data back
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Get users who haven't completed all of their reviews
// Sorted by least complete to most complete by percentage, not including 100%
router.get("/:assignmentId/completion", async(req, res) => {
    const { assignmentId } = req.params;
    const { page, perPage } = req.query;
    const { userId } = req.body;
    try{
        // Check for query parameters
        if (!page || !perPage)
            throw new HttpError(
                "Page and per page query parameters must be provided", 400
            );
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(query, userId, assignmentId);
        // Call the service
        const data = await AnalyticsService.getCompletionByAssignment(query, assignmentId, page, perPage);
        // Send the data back
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Create a new assignment
router.post("/create", async(req, res) => {
    const { userId, workspaceId, name, startDate, dueDate, questions, description } = req.body;
    try{
        // Check for required fields
        if (!userId || !workspaceId || !name || !dueDate || !questions){
            throw new HttpError("One or more required fields is not present", 400);
        }

        // Check that questions exists and there is at least one question
        if (!Array.isArray(questions) || questions.length < 1)
            throw new HttpError("Assignments must have at least one question", 400);

        await query('BEGIN');
        // Check that the user is an instructor
        await WorkspaceService.checkInstructor(query, userId, workspaceId);
        // Build the settings object, these will be used to create the new assignment
        const settings = { name, startDate, dueDate, questions, description };
        // Call the service
        const data = await AssignmentService.create(query, workspaceId, settings);
        await query('COMMIT');
        // Send the data back
        res.json(data);
    }
    catch(err){
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Edit an assignment
router.put("/edit", async(req, res) => {
    const { 
        userId, assignmentId, name, startDate, dueDate, 
        questions, description 
    } = req.body;
    try{
        await query('BEGIN');
        // Check for required fields
        if (!assignmentId){
            throw new HttpError("One or more required fields is not present", 400);
        }
        // Check that questions is a proper array if it exists
        if (questions && (!Array.isArray(questions) || questions.length < 1))
            throw new HttpError("Assignments must have at least one question", 400);

        // Build the settings object used to update the assignment
        const settings = { name, startDate, dueDate, questions, description };
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(query, userId, assignmentId);
        // Call the service
        const data = await AssignmentService.edit(query, assignmentId, settings);
        await query('COMMIT');
        return res.json(data);
    }
    catch(err){
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Delete an assignment
router.delete("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    try{
        await query('BEGIN');
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(query, userId, assignmentId);
        // Call the service
        const data = await AssignmentService.deleteAssignment(query, assignmentId);
        await query('COMMIT');
        res.json(data);
    }
    catch(err){
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

export default router;
