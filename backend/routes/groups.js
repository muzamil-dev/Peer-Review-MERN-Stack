import express from 'express';
import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as GroupService from "../services/groups.js";
import * as WorkspaceService from "../services/workspaces.js";

const router = express.Router();

// Require JWT
if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

// Get a group by its id
router.get("/:groupId", async(req, res) => {
    let db, group;
    const { members } = req.query;
    const { groupId } = req.params;
    try{
        db = await pool.connect();
        if (members === 'true')
            group = await GroupService.getByIdWithMembers(db, groupId);
        else
            group = await GroupService.getById(db, groupId);
        return res.json(group);
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

// Create a new group
router.post("/create", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, workspaceId, name } = req.body;
        // Check that the required fields are provided
        if (!workspaceId || !name)
            throw new HttpError("One or more required fields is missing", 400);
        // Check that the person creating the group is an instructor
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Create the group
        const group = await GroupService.createGroup(db, workspaceId, name);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.status(201).json(group);
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

// Edit a group's info (only name)
router.put("/edit", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, groupId, name } = req.body;
        const updates = { name };
        // Check that the groupId was provided
        if (!groupId)
            throw new HttpError("One or more required fields is missing", 400);
        // Get the group workspace
        const workspaceId = (await GroupService.getById(db, groupId)).workspaceId;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Edit the workspace
        const msg = await GroupService.edit(db, groupId, updates);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.json(msg);
    }
    catch(err){
        if (db) 
            await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Move a user to a different group
router.put("/moveUser", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, targetId, groupId } = req.body;
        // Check that the groupId was provided
        if (!targetId || !groupId)
            throw new HttpError("One or more required fields is missing", 400);
        // Check that the user requesting is an instructor
        await GroupService.checkInstructor(db, userId, groupId);
        // Add the user
        const msg = await GroupService.moveUser(db, targetId, groupId);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.json(msg);
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

// Delete a provided group
router.delete("/:groupId", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId } = req.body;
        const { groupId } = req.params;
        // Get the workspaceId of the group
        const workspaceId = (await GroupService.getById(db, groupId)).workspaceId;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Delete the workspace
        const msg = await GroupService.deleteGroup(db, groupId);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.json(msg);
    }
    catch(err){
        if (db) 
            await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
})

export default router;