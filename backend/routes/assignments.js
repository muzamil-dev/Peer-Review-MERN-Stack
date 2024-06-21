import express from 'express';
import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as AssignmentService from "../services/assignments.js";
import * as ReviewService from "../services/reviews.js";
import * as WorkspaceService from '../services/workspaces.js';

const router = express.Router();

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

// Get the details of an assignment
router.get("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    let db;
    try{
        db = await pool.connect();
        // Call the service
        const data = await AssignmentService.getById(db, assignmentId);
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Get all reviews created by a user for an assignment
router.get(["/:assignmentId/user", "/:assignmentId/user/:userId"], async(req, res) => {
    const { assignmentId } = req.params;
    let userId, db;
    // Call the service
    try{
        db = await pool.connect();
        // If a route parameter was provided, check that the person viewing is an instructor
        if (req.params.userId){
            // Check that the user is an instructor of the assignment's workspace
            await AssignmentService.checkInstructor(db, req.body.userId, assignmentId);
            userId = req.params.userId;
        }
        else
            userId = req.body.userId;
        // Call the service
        const data = await ReviewService.getByAssignmentAndUser(db, userId, assignmentId);
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Get all reviews written about a user (target) for an assignment
router.get("/:assignmentId/target/:targetId", async(req, res) => {
    const { assignmentId, targetId } = req.params;
    const { userId } = req.body;
    let db;
    try{
        db = await pool.connect();
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(db, userId, assignmentId);
        // Call the service
        const data = await ReviewService.getByAssignmentAndTarget(
                        db, targetId, assignmentId);
        // Send the data back
        res.json(data);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Create a new assignment
router.post("/create", async(req, res) => {
    const { userId, workspaceId, name, startDate, dueDate, questions, description } = req.body;
    let db;
    try{
        // Check for required fields
        if (!userId || !workspaceId || !name || !dueDate || !questions){
            throw new HttpError("One or more required fields is not present", 400);
        };

        // Check that questions exists and there is at least one question
        if (!Array.isArray(questions) || questions.length < 1)
            throw new HttpError("Assignments must have at least one question", 400);

        // Connect to the database
        db = await pool.connect();
        await db.query('BEGIN');
        // Check that the user is an instructor
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Build the settings object, these will be used to create the new assignment
        const settings = { name, startDate, dueDate, questions, description };
        // Call the service
        const data = await AssignmentService.create(db, workspaceId, settings);
        await db.query('COMMIT');
        // Send the data back
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

// Edit an assignment
router.put("/edit", async(req, res) => {
    const { 
        userId, assignmentId, name, startDate, dueDate, 
        questions, description 
    } = req.body;
    let db;
    try{
        // Connect to the database
        db = await pool.connect();
        await db.query('BEGIN');
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
        await AssignmentService.checkInstructor(db, userId, assignmentId);
        // Call the service
        const data = await AssignmentService.edit(db, assignmentId, settings);
        await db.query('COMMIT');
        return res.json(data);
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

// Delete an assignment
router.delete("/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    let db;
    try{
        // Connect to the database
        db = await pool.connect();
        await db.query('BEGIN');
        // Check that the user is an instructor of the assignment's workspace
        await AssignmentService.checkInstructor(db, userId, assignmentId);
        // Call the service
        const data = await AssignmentService.deleteAssignment(db, assignmentId);
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